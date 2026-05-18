import { ForgotPasswordForm } from "@/components/organisms/forms/ForgotPasswordForm";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";

export const metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPageTemplate>
      <ForgotPasswordForm />
    </AuthPageTemplate>
  );
}
