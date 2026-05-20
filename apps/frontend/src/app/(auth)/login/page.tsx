import { Metadata } from "next";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { LoginForm } from "@/components/organisms/forms/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log into your UMTAS account",
};

export default function LoginPage() {
  return (
    <AuthPageTemplate>
      <LoginForm />
    </AuthPageTemplate>
  );
}
