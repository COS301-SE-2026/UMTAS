# OWASP ZAP Report

The release scans target `https://capstone-vigil.dns.net.za`. The [ZAP report](ZAP_REPORT.pdf) is the evidence path for the baseline and authenticated passive scans. NFR-Sec-2 requires zero Medium or High alerts. The repeatable scan command is `ZAP_CONTEXT_FILE=/absolute/path/context.context ZAP_USER=student bash apps/NFR/run_zap.sh` from the repository root. The context contains a dedicated synthetic test account and excludes destructive routes.
