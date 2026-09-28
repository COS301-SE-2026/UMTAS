## OWASP ZAP Report

The archived scan was generated on 2 September 2026 for `https://capstone-vigil.dns.net.za`.
Its summary records **0 High, 2 Medium, 3 Low and 3 Informational alerts**. The Medium alerts are
"Content Security Policy (CSP) Header Not Set" and "Missing Anti-clickjacking Header", with three
instances of each. NFR-Sec-2 requires zero alerts of Medium severity or above, so this report does
not demonstrate a pass. It also does not replace the specified authenticated staging scan.

After remediation, retain a new baseline and authenticated scan report with the target, date,
scan configuration and alert summary.

The current branch configures anti-clickjacking headers in the frontend and API. CSP remains
open: a policy permitting inline scripts or styles would itself trigger Medium ZAP alerts, while
a nonce-based policy needs application-wide browser verification. The archived scan predates the
header change. A safe CSP and a staging rescan are required before NFR-Sec-2 can be marked as
passing; the header change alone is not scan evidence.
[Open the complete OWASP ZAP PDF report](ZAP_REPORT.pdf).
