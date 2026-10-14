import type { Metadata } from "next";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";
import { LimitedUseNotice } from "@/components/molecules/legal/LimitedUseNotice";
import { LegalPageTemplate } from "@/components/templates/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const HEAD_CLASSES =
  "text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]";
const CELL_CLASSES = "whitespace-normal align-top text-[14px]";

export default function PrivacyPage() {
  return (
    <LegalPageTemplate
      title="Privacy Policy"
      summary="This policy explains what information UMTAS (University Modular Timetable & Analytics System) collects, why we collect it and the choices you have. We have tried to describe it as accurately as we can."
    >
      <section id="who-we-are">
        <h2>1. Who we are</h2>
        <p>
          UMTAS is operated by Team Vigil of the University of Pretoria. It is a
          student capstone project and is provided for academic purposes.
        </p>
        <p>
          For questions about this policy, contact us at{" "}
          <a href="mailto:vigil.cs2025@gmail.com">vigil.cs2025@gmail.com</a>.
          Please use this address for Information Officer enquiries.
        </p>
      </section>

      <section id="information-we-collect">
        <h2>2. Information we collect</h2>
        <p>
          The information we handle depends on the features you use. It falls
          into these groups:
        </p>
        <ul>
          <li>
            Sign-in and account: your name, email address and whether your email
            is verified. If you register with a password, it is stored in hashed
            form. If you sign in with Google, we receive your name, email
            address and profile picture from Google. We also keep session
            records, which include an IP address and browser details.
          </li>
          <li>
            Profile, university and role: the university you choose, your role
            (for example student or lecturer) and any role applications you
            submit.
          </li>
          <li>
            Modules and timetables: modules and courses you enrol in, personal
            events, timetable preferences, generated timetables and the colours
            you give modules.
          </li>
          <li>
            PDF timetable uploads: when you upload a timetable PDF, the file is
            stored in our object storage and read by our PDF parser service. The
            timetable entries it extracts are saved to create events.
          </li>
          <li>
            Attendance: if you take part in attendance sessions, we record that
            you attended, when, and how it was captured (barcode, camera or
            NFC). If you register an NFC sticker, we store its identifier and a
            hashed token. Lecturers may also save their attendance preferences.
          </li>
          <li>
            Lecture Watch: this feature uses your device camera. As far as we
            can tell from our code, the video is analysed in your browser and is
            not uploaded. UMTAS saves only summary counts for a session, such as
            how many frames showed attention or restlessness and how many
            questions were asked.
          </li>
          <li>
            Maps and venues: venue and building information held for your
            university. Map tiles are loaded from Google Maps in your browser,
            so Google receives the technical information that any map request
            involves.
          </li>
          <li>
            Email: we send verification and password-reset emails to the address
            you register with.
          </li>
          <li>
            Logs and metrics: our servers keep operational logs and performance
            metrics. Logs can include account events (such as sign-in, account
            linking and deletion) with user identifiers and email addresses.
          </li>
          <li>
            Analytics: we use PostHog to understand how the app is used and to
            find errors. This can include page views, performance data, error
            reports and session recordings with form inputs masked.
          </li>
        </ul>
      </section>

      <section id="google-user-data">
        <h2>3. Google user data</h2>
        <p>
          You can sign in to UMTAS with Google. You can also, if you choose,
          export your timetable to Google Calendar. This section explains what
          Google user data we access and why.
        </p>
        <p>
          What we access. When you sign in with Google, we access your name,
          email address and profile picture. Only when you export to Google
          Calendar do we also ask to see the list of calendars you can write to,
          to create a dedicated calendar named “UMTAS”, and to create, update
          and delete events in that calendar.
        </p>
        <p>
          Why we access it. Your name, email address and picture are used to
          create and display your account. The calendar permissions are used
          only to put your class sessions in a calendar called “UMTAS” in your
          Google account. We do not use them for any other purpose.
        </p>
        <p>
          How tokens are stored. The access and refresh tokens Google gives us
          are stored in encrypted form on our server.
        </p>
        <p>
          Calendar contents. From our review of the code, UMTAS does not save
          your calendar list or event contents in its own database. Events are
          written to Google, and a small identifier used to tell which events
          UMTAS created is stored on those events in Google.
        </p>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <Table>
            <caption className="sr-only">
              How UMTAS uses Google user data
            </caption>
            <TableHeader className="bg-[var(--bg-surface)]">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASSES}>Data item</TableHead>
                <TableHead className={HEAD_CLASSES}>Why we use it</TableHead>
                <TableHead className={HEAD_CLASSES}>When</TableHead>
                <TableHead className={HEAD_CLASSES}>Stored by UMTAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell className={CELL_CLASSES}>
                  Name, email address and profile picture
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  To create your UMTAS account and show who is signed in.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  When you sign in or register with Google.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Stored in your UMTAS account.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell className={CELL_CLASSES}>
                  The list of calendars you can write to
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  To check whether a calendar named “UMTAS” already exists.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Only when you choose Export to Google Calendar.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Not stored by UMTAS.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell className={CELL_CLASSES}>
                  Permission to create a calendar
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  To create a dedicated calendar named “UMTAS”, if you do not
                  have one.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Only when you choose Export to Google Calendar.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  The calendar lives in your Google account. UMTAS keeps no
                  copy.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell className={CELL_CLASSES}>
                  Events in the “UMTAS” calendar
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  To create, update and delete your class sessions in that
                  calendar.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Only when you choose Export to Google Calendar.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Events live in your Google account. UMTAS keeps no copy.
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableCell className={CELL_CLASSES}>
                  Access and refresh tokens
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  To act on your behalf with Google until you disconnect.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  When you sign in with Google or approve calendar access.
                </TableCell>
                <TableCell className={CELL_CLASSES}>
                  Stored encrypted on our server until you disconnect or delete
                  your account.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <ul>
          <li>We do not sell Google user data.</li>
          <li>We do not use Google user data for advertising.</li>
          <li>
            We do not use Google user data to develop, improve or train
            artificial intelligence or machine learning models.
          </li>
          <li>
            We do not allow people to read Google user data unless you give
            consent, it is needed for security purposes such as investigating
            abuse, or the law requires it.
          </li>
        </ul>
        <LimitedUseNotice />
      </section>

      <section id="how-we-use">
        <h2>4. How we use information</h2>
        <ul>
          <li>
            To create your account, sign you in and keep your session active.
          </li>
          <li>
            To build, solve and show timetables, and to let you export them.
          </li>
          <li>
            To run attendance and Lecture Watch sessions for the classes that
            use them.
          </li>
          <li>To send verification and password-reset emails.</li>
          <li>
            To keep the service secure, investigate problems and understand how
            it is used.
          </li>
          <li>To meet our legal obligations.</li>
        </ul>
      </section>

      <section id="sharing">
        <h2>5. Sharing and processors</h2>
        <p>
          We do not sell personal information. We use the following service
          providers to run UMTAS, and they may process information on our
          behalf:
        </p>
        <ul>
          <li>
            Hosting and infrastructure: the servers, database and object storage
            that run UMTAS.
          </li>
          <li>
            PostHog: product analytics, error reporting and session recordings.
          </li>
          <li>
            Email delivery: the mail service we use to send verification and
            password-reset emails.
          </li>
          <li>
            Google: sign-in, Google Calendar export (only if you use it) and
            Google Maps.
          </li>
        </ul>
        <p>
          Where your university uses features such as attendance or Lecture
          Watch, lecturers and administrators at that university can see the
          results that feature is designed to show them. We may also disclose
          information where the law requires it.
        </p>
      </section>

      <section id="storage-security">
        <h2>6. Storage, security and retention</h2>
        <p>
          We take reasonable steps to protect your information. Connections to
          UMTAS are intended to use HTTPS. Google OAuth tokens are stored
          encrypted, and passwords are stored hashed. No system is completely
          secure, so we cannot promise that information will never be exposed.
        </p>
        <p>
          Sessions last 7 days. Sensitive actions, such as deleting your
          account, ask you to have signed in recently.
        </p>
        <ul>
          <li>
            Account, profile, timetable, enrolment and attendance information:
            kept until you delete your account.
          </li>
          <li>
            University module PDFs and shared module groupings: kept after
            account deletion so we can recompute module groupings. Processing
            records linked to your account are deleted with your account.
          </li>
          <li>
            Google tokens: kept until you remove Google Calendar access or
            delete your account.
          </li>
          <li>
            Logs and metrics: a fixed retention period has not been published;
            contact us for details.
          </li>
          <li>
            Analytics: a fixed retention period has not been published; contact
            us for details.
          </li>
          <li>
            Backups: a fixed retention period has not been published; contact us
            for details.
          </li>
          <li>
            Inactive accounts: a fixed retention period has not been published;
            contact us for details.
          </li>
        </ul>
      </section>

      <section id="your-rights">
        <h2>7. Your rights under POPIA</h2>
        <p>Under POPIA, you may:</p>
        <ul>
          <li>
            ask what personal information we hold about you and request access
            to it;
          </li>
          <li>ask us to correct information that is inaccurate;</li>
          <li>ask us to delete your personal information;</li>
          <li>object to us processing your personal information; and</li>
          <li>
            complain to the Information Regulator (South Africa) if you believe
            your information has been handled unlawfully.
          </li>
        </ul>
        <p>
          To make a request, email us at{" "}
          <a href="mailto:vigil.cs2025@gmail.com">vigil.cs2025@gmail.com</a>.
        </p>
      </section>

      <section id="deleting-account">
        <h2>8. Deleting your account and disconnecting Google</h2>
        <p>
          You can remove UMTAS&apos;s access to your Google Calendar, or delete
          your account, from <Link href="/account">Account settings</Link>.
          Removing access asks Google to revoke the tokens we hold. Deleting
          your account removes your personal records from UMTAS. University
          module PDFs and shared module groupings are retained so we can
          recompute module groupings. We also attempt to revoke Google access;
          if Google is unavailable, you can remove access through Google Account
          permissions below.
        </p>
        <p>
          You can also review and remove UMTAS&apos;s access at any time in your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Account permissions
          </a>
          . Events already written to your Google Calendar stay in your Google
          account until you delete them there.
        </p>
      </section>

      <section id="cookies">
        <h2>9. Cookies and analytics</h2>
        <p>
          We use cookies to keep you signed in and to remember your theme and
          university choice. PostHog may set cookies or use local storage to
          recognise returning visitors. Session recordings mask form inputs. You
          can block cookies in your browser, but parts of UMTAS may then stop
          working.
        </p>
      </section>

      <section id="children">
        <h2>10. Children</h2>
        <p>
          UMTAS is intended for university students and staff. It is not aimed
          at children, and we do not knowingly collect information from them. If
          you think a child has given us information, please contact us.
        </p>
      </section>

      <section id="changes">
        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The “last updated” date
          at the top shows when it last changed. If a change is significant, we
          will try to tell you in the app.
        </p>
      </section>

      <section id="contact">
        <h2>12. Contact</h2>
        <p>
          Questions about this policy or your information? Email{" "}
          <a href="mailto:vigil.cs2025@gmail.com">vigil.cs2025@gmail.com</a>,
          addressed to Team Vigil of the University of Pretoria.
        </p>
      </section>
    </LegalPageTemplate>
  );
}
