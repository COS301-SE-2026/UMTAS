import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { LoginForm } from "@/components/organisms/forms/LoginForm";

export default function LoginPage() {
  return (
    <AuthPageTemplate>
      <LoginForm />
    </AuthPageTemplate>
  );
}
