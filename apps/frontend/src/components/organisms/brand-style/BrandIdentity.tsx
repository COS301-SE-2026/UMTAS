"use client";

import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { IdentityTable } from "@/components/molecules/brand-style/IdentityTable";

export function BrandIdentity() {
  return (
    <div className="w-full mx-auto py-8 text-[var(--text-secondary)]">
      <section className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Brand Identity
          </h1>
          <p className="text-base leading-relaxed">
            <strong className="text-[var(--text-primary)]">
              UMTAS (University Modular Timetable & Analytics System)
            </strong>
            {" - "}Professional, precise and uncluttered. UMTAS is a tool for
            students and administrators at South African universities. The
            visual language must communicate trust, clarity and competence - not
            playfulness or decoration.
          </p>
        </div>

        <div className="p-4 bg-bg-surface rounded-lg border border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-2">
            Design Philosophy
          </h3>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">
              Monochrome charcoal.
            </strong>{" "}
            Visual hierarchy achieved through tone, weight, spacing and subtle
            shadow. Institutional-grade UI, not cold.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3 pb-1 border-b border-border">
            Logo
          </h2>
          <div className="p-4 bg-bg-base rounded-lg border border-border inline-block mb-3 shadow-sm transition-colors duration-[var(--duration-fast)]">
            <UmtasLogo />
          </div>
          <p className="text-sm leading-relaxed">
            UMTAS has an existing logo consisting of a calendar icon paired with
            the UMTAS wordmark in DM Sans SemiBold.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3 pb-1 border-b border-border">
            Voice & Tone
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            <strong className="text-[var(--text-primary)]">
              Voice (constant personality):
            </strong>{" "}
            Helpful guide - clear and supportive, never cold. UMTAS speaks like
            a knowledgeable colleague who anticipates what the user needs and
            explains it simply. It is never terse to the point of being
            unhelpful, and never chatty to the point of wasting time.
          </p>
        </div>

        <IdentityTable />
      </section>
    </div>
  );
}
