# First hosted deployment approval

Copy this file to `docs/evidence/first-deployment-approval.md` only when the
project is ready to request its first hosted deployment. The owner must review
the exact release candidate and approve the temporary deferral of only the
host-dependent controls for no more than seven days. This record does not approve public publication by
itself; all other red controls must pass the predeploy check.

- **Status:** pending
- **Approved by:** pending
- **Approved on:** pending
- **Expires on:** pending
- **Approval record:** pending
- **Deferred controls:** SEC-027, OPS-002

After the first hosted deployment, verify HTTPS, assets, monitoring and alert
delivery on the real URL, record rollback results, then run the full
`scripts/check-charter.sh --release` gate. If verification fails, follow the
project's rollback procedure and do not call the deployment released.
