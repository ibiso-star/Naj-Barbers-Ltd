"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { DataError } from "@/lib/data/errors";
import { getRepository } from "@/lib/data/get-repository";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const ws = await getRepository().createWorkspace(name, slug);
      router.push(`/w/${ws.slug}/overview`);
    } catch (err) {
      setError(err instanceof DataError ? err.message : "Couldn't create the workspace. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <Field label="Workspace name" htmlFor="ws-name">
        <Input
          id="ws-name" required maxLength={80} value={name} autoFocus
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="URL" htmlFor="ws-slug" error={error} hint={slug ? `Address: /w/${slug}` : "Lowercase letters, numbers and dashes"}>
        <Input
          id="ws-slug" required maxLength={40} value={slug} aria-invalid={Boolean(error)}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
      </Field>
      <Button type="submit" variant="primary" pending={pending} disabled={!name.trim() || !slug}>Create workspace</Button>
    </form>
  );
}
