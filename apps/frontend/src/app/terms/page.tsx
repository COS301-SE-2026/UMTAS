import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageTemplate } from "@/components/templates/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPageTemplate
      title="Terms of Service"
      summary="These terms describe the rules for using UMTAS (University Modular Timetable & Analytics System). Please read them before you use the service."
    >
      <section id="acceptance">
        <h2>1. Acceptance</h2>
        <p>
          By creating an account or using UMTAS, you agree to these terms and
          acknowledge our <Link href="/privacy">Privacy Policy</Link>. If you do
          not agree, please do not use the service.
        </p>
      </section>

      <section id="service">
        <h2>2. The service</h2>
        <p>
          UMTAS is a student capstone project at the University of Pretoria, run
          by Team Vigil. It helps with timetables, modules, attendance and
          related features. It is an academic project, so features may change,
          be limited or be removed.
        </p>
      </section>

      <section id="accounts">
        <h2>3. Accounts and roles</h2>
        <p>
          You are responsible for the details you provide and for keeping your
          sign-in details private. Some roles, such as lecturer or
          administrator, need approval before their features are available.
          Please tell us if you think your account has been used without your
          permission.
        </p>
      </section>

      <section id="acceptable-use">
        <h2>4. Acceptable use</h2>
        <p>Please do not:</p>
        <ul>
          <li>
            record attendance for someone who is not present, or otherwise
            misuse the attendance features;
          </li>
          <li>
            use Lecture Watch to monitor people without the permission of the
            people involved and the institution;
          </li>
          <li>scrape, copy or collect data from the service in bulk;</li>
          <li>
            attempt to break, overload or gain access to parts of the service
            you are not allowed to use; or
          </li>
          <li>
            use the service to break the law or your university&apos;s rules.
          </li>
        </ul>
      </section>

      <section id="user-content">
        <h2>5. Your content</h2>
        <p>
          You keep ownership of the files you upload, such as timetable PDFs.
          You give us permission to store and process them so we can provide the
          service. Please only upload files you are allowed to share.
        </p>
      </section>

      <section id="third-party">
        <h2>6. Third-party services</h2>
        <p>
          Some features rely on services run by others. If you use Google
          sign-in or export to Google Calendar, your use of Google is also
          subject to Google&apos;s own terms and policies. We are not
          responsible for services we do not run.
        </p>
      </section>

      <section id="availability">
        <h2>7. Availability and no warranty</h2>
        <p>
          UMTAS is provided “as is” and “as available”. It may be unavailable at
          times, and generated timetables or other results may contain mistakes.
          Please check important dates and venues with your university.
        </p>
      </section>

      <section id="liability">
        <h2>8. Limitation of liability</h2>
        <p>
          To the extent the law allows, we are not liable for loss or damage
          that results from using, or being unable to use, the service. Nothing
          in these terms limits any right you have that cannot lawfully be
          limited.
        </p>
      </section>

      <section id="termination">
        <h2>9. Termination and account deletion</h2>
        <p>
          You can delete your account at any time from{" "}
          <Link href="/account">Account settings</Link>. We may suspend or
          remove accounts that break these terms or put the service at risk.
        </p>
      </section>

      <section id="changes">
        <h2>10. Changes to these terms</h2>
        <p>
          We may update these terms. The “last updated” date at the top shows
          the latest version. Continuing to use the service after a change means
          you accept the updated terms.
        </p>
      </section>

      <section id="governing-law">
        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of the Republic of South Africa.
        </p>
      </section>

      <section id="contact">
        <h2>12. Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:vigil.cs2025@gmail.com">vigil.cs2025@gmail.com</a>.
        </p>
      </section>
    </LegalPageTemplate>
  );
}
