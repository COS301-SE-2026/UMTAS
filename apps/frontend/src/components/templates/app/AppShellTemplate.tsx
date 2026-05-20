import { TopNavBar } from "@/components/organisms/nav/TopNavBar";
import { PageWrapper } from "@/components/templates/app/PageWrapper";

interface AppShellTemplateProps {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
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
  userEmail,
}: AppShellTemplateProps) {
  return (
    <div className="min-h-dvh bg-[-var(-bg-base)] flex flex-col">
      <TopNavBar userName={userName} userEmail={userEmail} />
      <PageWrapper>{children}</PageWrapper>
    </div>
  );
}
