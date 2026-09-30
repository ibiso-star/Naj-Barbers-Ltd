import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// A11Y-001: automated WCAG 2.2 AA scan of every critical surface. Manual
// keyboard checks are covered by the journeys (drag via keyboard sensor,
// "/" search, "c" new task, Escape to close) and recorded in evidence.md.
const pages = [
  "/w/atlas/overview",
  "/w/atlas/projects",
  "/w/atlas/tasks",
  "/w/atlas/tasks?view=list",
  "/w/atlas/team",
  "/w/atlas/settings",
  "/w/harbor/overview",
];

for (const path of pages) {
  test(`no WCAG 2.2 AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector("h1");
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary, summary.join("\n")).toEqual([]);
  });
}

test("no violations with the task drawer and new-task modal open", async ({ page }) => {
  await page.goto("/w/atlas/tasks");
  await page.getByTestId("task-card").first().click();
  await page.getByRole("heading", { name: "Activity" }).waitFor();
  let results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await page.keyboard.press("c");
  await page.getByRole("dialog", { name: "New task" }).waitFor();
  results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
