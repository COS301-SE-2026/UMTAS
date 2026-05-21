import { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { LoginForm } from "@/components/organisms/forms/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log into your UMTAS account",
};

export default function LoginPage() {
  return (
    <AuthPageTemplate>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthPageTemplate>
  );
}
