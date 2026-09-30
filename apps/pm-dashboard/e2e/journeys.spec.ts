import { expect, test, type Page } from "@playwright/test";

// Each test starts from pristine sample data.
test.beforeEach(async ({ page }) => {
  await page.goto("/w/atlas/overview");
  await page.evaluate(() => localStorage.clear());
});

async function openBoard(page: Page, slug = "atlas") {
  await page.goto(`/w/${slug}/tasks`);
  await expect(page.getByTestId("kanban")).toBeVisible();
}

async function dragCardTo(page: Page, card: ReturnType<Page["locator"]>, column: ReturnType<Page["locator"]>) {
  await card.scrollIntoViewIfNeeded();
  const from = (await card.boundingBox())!;
  const to = (await column.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 16 });
  await page.mouse.up();
}

test("F2 overview shows KPIs, charts with tooltips, heatmap and overdue items", async ({ page }) => {
  await page.goto("/w/atlas/overview");
  for (const id of ["kpi-projects", "kpi-completed", "kpi-budget", "kpi-overdue"]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  await expect(page.getByTestId("kpi-projects")).toContainText("5");
  await expect(page.getByTestId("completion-chart").locator(".recharts-line")).toHaveCount(2);
  await expect(page.getByTestId("workload-heatmap")).toBeVisible();

  const bars = page.getByTestId("velocity-chart").locator(".recharts-bar-rectangle");
  await expect(bars.first()).toBeVisible();
  const box = (await page.getByTestId("velocity-chart").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6);
  await expect(page.getByText(/tasks? completed/).first()).toBeVisible();

  await page.getByTestId("kpi-projects").click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("J1 add a task, drag it across columns, and it persists", async ({ page }) => {
  await openBoard(page);
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Write launch announcement");
  await dialog.getByLabel("Priority").selectOption("high");
  await dialog.getByLabel("Due date").fill("2026-12-01");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(dialog).toBeHidden();

  const todo = page.getByTestId("column-todo");
  const card = todo.getByTestId("task-card").filter({ hasText: "Write launch announcement" });
  await expect(card).toBeVisible();

  const inProgress = page.getByTestId("column-in_progress");
  await dragCardTo(page, card, inProgress);
  await expect(inProgress.getByText("Write launch announcement")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("column-in_progress").getByText("Write launch announcement")).toBeVisible();
});

test("J1 validation: an empty title is rejected with a message", async ({ page }) => {
  await openBoard(page);
  await page.keyboard.press("c");
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Title is required");
});

test("F4 realtime: a move in one tab appears in another without reload", async ({ page, context }) => {
  await openBoard(page);
  const other = await context.newPage();
  await openBoard(other);

  const card = page.getByTestId("column-todo").getByTestId("task-card").first();
  const title = (await card.locator("p").first().textContent())!;
  await dragCardTo(page, card, page.getByTestId("column-done"));
  await expect(page.getByTestId("column-done").getByText(title, { exact: true })).toBeVisible();
  await expect(other.getByTestId("column-done").getByText(title, { exact: true })).toBeVisible({ timeout: 3000 });
});

test("F7 drawer edits status, assignee and subtasks, and logs activity", async ({ page }) => {
  await openBoard(page);
  await page.getByTestId("column-todo").getByTestId("task-card").first().click();
  const drawer = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Activity" }) });
  await expect(drawer).toBeVisible();

  await drawer.getByLabel("Assignee").selectOption({ label: "Gethin Morgan" });
  await drawer.getByLabel("Status").selectOption("in_progress");
  await drawer.getByLabel("New subtask").fill("Check copy with legal");
  await drawer.getByLabel("New subtask").press("Enter");
  await expect(drawer.getByText("Check copy with legal", { exact: true })).toBeVisible();

  await expect(drawer.getByText("assigned it to Gethin Morgan")).toBeVisible();
  await expect(drawer.getByText(/moved it from Todo to In Progress/)).toBeVisible();
  await expect(drawer.getByText("added subtask “Check copy with legal”")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByTestId("column-in_progress").getByText("Check copy with legal")).toHaveCount(0);
});

test("F6 fuzzy search and priority filter narrow the board", async ({ page }) => {
  await openBoard(page);
  const cards = page.getByTestId("task-card");
  const total = await cards.count();
  await page.keyboard.press("/");
  await page.keyboard.type("wirefrmes");
  await expect(cards.filter({ hasText: "Wireframes: home and pricing" })).toBeVisible();
  expect(await cards.count()).toBeLessThan(total);

  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("button", { name: /^Priority/ }).click();
  await page.getByRole("menuitemcheckbox", { name: /High/ }).click();
  await page.keyboard.press("Escape");
  const highOnly = await cards.count();
  expect(highOnly).toBeGreaterThan(0);
  expect(highOnly).toBeLessThan(total);
  await expect(page.getByRole("status").filter({ hasText: /of \d+ tasks/ })).toBeVisible();
});

test("J2 switch workspace re-scopes data; a foreign workspace is denied", async ({ page }) => {
  await page.goto("/w/atlas/overview");
  await page.getByRole("button", { name: /Switch workspace/ }).click();
  await page.getByRole("menuitemradio", { name: /Beacon Labs/ }).click();
  await expect(page).toHaveURL(/\/w\/beacon\/overview/);
  await expect(page.getByTestId("kpi-projects")).toContainText("2");

  await page.goto("/w/harbor/overview");
  await expect(page.getByRole("heading", { name: "You don't have access to this workspace" })).toBeVisible();
  await expect(page.getByText("Community programme")).toHaveCount(0);
});

test("J4 members cannot invite; admins can", async ({ page }) => {
  await page.goto("/w/beacon/team");
  await page.getByRole("button", { name: "Invite team" }).first().click();
  await expect(page.getByText(/Only workspace admins can invite people/)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/w/atlas/team");
  await page.getByRole("button", { name: "Invite team" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Invite to workspace" });
  await dialog.getByLabel("Email").fill("new.hire@example.test");
  await dialog.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByTestId("invites-list")).toContainText("new.hire@example.test");
});

test("F3 new project from the modal appears in the list", async ({ page }) => {
  await page.goto("/w/atlas/projects");
  await page.getByRole("button", { name: "New project" }).click();
  const dialog = page.getByRole("dialog", { name: "New project" });
  await dialog.getByLabel("Name").fill("Customer portal");
  await expect(dialog.getByLabel("Key")).toHaveValue("CP");
  await dialog.getByLabel("Budget (GBP)").fill("12000");
  await dialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByTestId("projects-table")).toContainText("Customer portal");
  await expect(page.getByTestId("projects-table")).toContainText("£12,000");
});

test("A11Y keyboard: open a card with Enter and move it across columns with Space + arrows", async ({ page }) => {
  await openBoard(page);
  const card = page.getByTestId("column-backlog").getByTestId("task-card").first();
  const title = (await card.locator("p").first().textContent())!;

  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
  await page.keyboard.press("Escape");

  // dnd-kit measures layout between key presses, so give each step a frame.
  await card.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await expect(page.getByTestId("column-todo").getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByTestId("column-backlog").getByText(title, { exact: true })).toHaveCount(0);
});

test("A11Y keyboard: list rows open the drawer with Enter", async ({ page }) => {
  await page.goto("/w/atlas/tasks?view=list");
  const row = page.getByTestId("task-list").getByRole("button", { name: /Localisation groundwork/ });
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
});
