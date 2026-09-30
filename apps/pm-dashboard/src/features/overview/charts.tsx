"use client";

import {
  Bar, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  type TooltipContentProps, type TooltipValueType,
} from "recharts";
import type { MonthCompletion, WeekVelocity } from "@/lib/metrics";
import { DataTable, LegendKey, TooltipFrame } from "./ChartCard";

// Chart ink (dataviz reference, dark): recessive grid and axes.
export const CHART = {
  grid: "#232326",
  axis: "#3f3f46",
  tick: "#8e8e97",
  series1: "#3987e5",
  series2: "#d95926",
  reference: "#a1a1aa",
  cursor: "rgba(255,255,255,0.04)",
};
const tick = { fill: CHART.tick, fontSize: 11 };

export function CompletionLegend() {
  return (
    <div className="flex items-center gap-3">
      <LegendKey color={CHART.series1} label="Completed" />
      <LegendKey color={CHART.series2} label="On time" />
    </div>
  );
}

function CompletionTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const d = payload?.[0]?.payload as MonthCompletion | undefined;
  if (!active || !d) return null;
  const pct = (v: number | null) => (v === null ? "–" : `${v}%`);
  return (
    <TooltipFrame
      title={`${d.label}${d.partial ? " (so far)" : ""} · ${d.due} due`}
      rows={[
        { color: CHART.series1, value: pct(d.completionRate), label: `completed (${d.completed})` },
        { color: CHART.series2, value: pct(d.onTimeRate), label: `on time (${d.onTime})` },
      ]}
      note={d.due === 0 ? "Nothing was due this month" : undefined}
    />
  );
}

/** Six-month completion rate: share of tasks due each month that got done. */
export function CompletionChart({ data }: { data: MonthCompletion[] }) {
  return (
    <div className="h-[240px]" data-testid="completion-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: CHART.axis }} tickMargin={8} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} tick={tick} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={CompletionTooltip} cursor={{ stroke: CHART.axis, strokeWidth: 1 }} />
          <Line type="monotone" dataKey="completionRate" stroke={CHART.series1} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: "#111113" }} activeDot={{ r: 5, stroke: "#111113", strokeWidth: 2 }} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="onTimeRate" stroke={CHART.series2} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: "#111113" }} activeDot={{ r: 5, stroke: "#111113", strokeWidth: 2 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompletionTable({ data }: { data: MonthCompletion[] }) {
  return (
    <DataTable
      head={["Month", "Due", "Completed", "On time"]}
      rows={data.map((d) => [
        `${d.label}${d.partial ? " (so far)" : ""}`,
        d.due,
        d.completionRate === null ? "–" : `${d.completionRate}%`,
        d.onTimeRate === null ? "–" : `${d.onTimeRate}%`,
      ])}
    />
  );
}

export function VelocityLegend() {
  return (
    <div className="flex items-center gap-3">
      <LegendKey color={CHART.series1} label="Completed" />
      <LegendKey color={CHART.reference} label="4-week average" dashed />
    </div>
  );
}

function VelocityTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const d = payload?.[0]?.payload as WeekVelocity | undefined;
  if (!active || !d) return null;
  return (
    <TooltipFrame
      title={`${d.rangeLabel}${d.partial ? " (so far)" : ""}`}
      rows={[
        { color: CHART.series1, value: String(d.completed), label: d.completed === 1 ? "task completed" : "tasks completed" },
        { color: CHART.reference, value: String(d.average), label: "4-week average", dashed: true },
      ]}
    />
  );
}

/** Project velocity: tasks completed per week with a trailing average. */
export function VelocityChart({ data }: { data: WeekVelocity[] }) {
  return (
    <div className="h-[240px]" data-testid="velocity-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: -16 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: CHART.axis }} tickMargin={8} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={VelocityTooltip} cursor={{ fill: CHART.cursor }} />
          <Bar dataKey="completed" fill={CHART.series1} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Line type="monotone" dataKey="average" stroke={CHART.reference} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VelocityTable({ data }: { data: WeekVelocity[] }) {
  return (
    <DataTable
      head={["Week of", "Completed", "4-wk avg"]}
      rows={data.map((d) => [`${d.label}${d.partial ? " (so far)" : ""}`, d.completed, d.average])}
    />
  );
}
