import type { Metadata } from "next";
import { TeamView } from "@/features/team/TeamView";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return <TeamView />;
}
