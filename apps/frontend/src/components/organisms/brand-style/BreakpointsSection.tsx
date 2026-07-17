"use client";

import { BreakpointItem } from "@/types/BrandStyle";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";

const breakpointsData: BreakpointItem[] = [
  {
    bp: "Mobile",
    width: "< 640px",
    cols: "1",
    behaviour:
      "Single column. Nav collapses to hamburger. Cards stack full-width. Schedule grid scrolls horizontally.",
  },
  {
    bp: "Tablet",
    width: "640px - 1024px",
    cols: "2",
    behaviour:
      "2-column card grid. Sticky nav remains visible. Schedule grid scrolls horizontally.",
  },
  {
    bp: "Desktop",
    width: "> 1024px",
    cols: "12",
    behaviour:
      "Full 12-column grid. Max-width 1280px centered. Primary design target.",
  },
];

export function BreakpointSection() {
  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Responsive Breakpoints
        </h1>
        <p className="leading-relaxed max-w-2xl">
          Desktop-primary. Mobile-ready. Three Breakpoints. The schedule grid
          and dense data views are designed for desktop first, but every screen
          reflowing correctly at tablet and mobile widths is a requirement.
        </p>
      </div>

      <div className="border border-[var(--border)] rounded-xl overflow-hidden mb-8 bg-[var(--bg-base)]">
        <Table>
          <TableHeader className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]">
            <TableRow className="border-breakpoint border-[var(--border)] hover:bg-transparent">
              <TableHead className="w-[120px] text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                Breakpoint
              </TableHead>
              <TableHead className="w-[160px] text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                Width
              </TableHead>
              <TableHead className="w-[60px] text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                Cols
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                Behaviour
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakpointsData.map((breakpoint) => (
              <TableRow
                key={breakpoint.bp}
                className="border-breakpoint border-[var(--border)] hover:bg-transparent"
              >
                <TableCell className="text-[13px] font-medium text-[var(--text-primary)]">
                  {breakpoint.bp}
                </TableCell>
                <TableCell className="text-[13px] font-mono text-[var(--text-secondary)]">
                  {breakpoint.width}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--text-secondary)]">
                  {breakpoint.cols}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--text-secondary)] leading-[1.5]">
                  {breakpoint.behaviour}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)] mb-3">
          Tailwind Prefix Reference
        </p>
        <div className="flex gap-2 flex-wrap">
          {[
            { prefix: "sm:", width: "640px" },
            { prefix: "md:", width: "768px" },
            { prefix: "lg:", width: "1024px" },
            { prefix: "xl:", width: "1280px" },
          ].map((bp) => (
            <Badge
              key={bp.prefix}
              variant="outline"
              className="px-3 py-1.5 bg-[var(--bg-surface)] border-[var(--border)] flex items-center gap-2 rounded-md hover:bg-[var(--bg-surface)]"
            >
              <code className="font-mono text-[13px] font-medium text-[var(--text-primary)]">
                {bp.prefix}
              </code>
              <span className="text-[11px] text-[var(--text-disabled)]">
                {bp.width}
              </span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
