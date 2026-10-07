interface LegalPageTemplateProps {
  title: string;
  summary: string;
  children: React.ReactNode;
}

const CONTENT_CLASSES = [
  "max-w-3xl space-y-10 text-[14px] leading-[1.6] text-[var(--text-primary)]",
  "[&_section]:scroll-mt-24 [&_section>*+*]:mt-4",
  "[&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:leading-[1.4]",
  "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
  "[&_a]:rounded-sm [&_a]:underline [&_a]:underline-offset-2",
  "[&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[var(--ring)]",
].join(" ");

export function LegalPageTemplate({
  title,
  summary,
  children,
}: LegalPageTemplateProps) {
  return (
    <div className="max-w-[1280px] mx-auto py-12 px-6 md:px-8">
      <header className="mb-12 max-w-3xl space-y-4">
        <h1 className="text-[32px] font-semibold leading-[1.2] text-[var(--text-primary)]">
          {title}
        </h1>
        <p className="text-[11px] font-medium uppercase leading-[1.4] tracking-[0.04em] text-[var(--text-secondary)]">
          Last updated: 5 October 2026 · Effective: 5 October 2026
        </p>
        <p className="text-[14px] leading-[1.6] text-[var(--text-primary)]">
          {summary}
        </p>
      </header>
      <div className={CONTENT_CLASSES}>{children}</div>
    </div>
  );
}
