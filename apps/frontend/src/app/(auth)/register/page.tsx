import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageTemplate } from "@/components/templates/auth/AuthPageTemplate";
import { RegisterForm } from "@/components/organisms/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Create account - UMTAS",
  description: "Register for a UMTAS account to start building your timetable.",
};

export default function RegisterPage() {
  return (
    <AuthPageTemplate>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthPageTemplate>
  );
}
