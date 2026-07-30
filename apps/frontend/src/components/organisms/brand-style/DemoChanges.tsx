"use client";

import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { IdentityTable } from "@/components/molecules/brand-style/IdentityTable";

export function DemoChanges() {
  return (
    <div className="w-full mx-auto py-8 text-[var(--text-secondary)]">
      <section className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Changes Since Demo 1
          </h1>
          <p className="text-base leading-relaxed">
            Since Demo 1, the HSL and RGB colours for all of the selected
            colours has been added.
          </p>
        </div>
      </section>
    </div>
  );
}
