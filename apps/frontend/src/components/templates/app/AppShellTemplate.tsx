import { TopNavBar } from "@/components/organisms/nav/TopNavBar";
import { PageWrapper } from "@/components/templates/app/PageWrapper";

interface AppShellTemplateProps {
  children: React.ReactNode;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function AppShellTemplate({ children }: AppShellTemplateProps) {
  return (
    <div className="min-h-dvh bg-[--bg-base] flex flex-col">
      <TopNavBar />
      <PageWrapper>{children}</PageWrapper>
    </div>
  );
}
