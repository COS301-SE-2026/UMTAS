import { TopNavBar } from "@/components/organisms/nav/TopNavBar";
import { PageWrapper } from "@/components/templates/app/PageWrapper";

interface AppShellTemplateProps {
  children: React.ReactNode;
  userName?: string | null;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function AppShellTemplate({
  children,
  userName,
}: AppShellTemplateProps) {
  return (
    <div className="min-h-dvh bg-[-var(-bg-base)] flex flex-col">
      <TopNavBar userName={userName} />
      <PageWrapper>{children}</PageWrapper>
    </div>
  );
}
