# Risk exception authority

The project names an **accountable release owner** and, when needed, an
**independent security/privacy/legal reviewer** in `PRD.md` section 11. The
release owner accepts every exception by name and links the approval record.
For an actual risk acceptance on a `SEC`, `IR`, `LEGAL`, or `MOB` control, the
named independent reviewer must also review it. A specific N/A decision can
be approved by the release owner alone. A reviewer name in a document is a
claim of authority; the release reviewer must confirm it is real.

The following controls cannot be excepted, even as N/A. They must be checked
with evidence before release:

| Control | Reason |
|---|---|
| `SEC-018` | No credentials or secrets in the repository or its history |
| `PROD-021` | No fabricated testimonials presented as real |
| `PROD-022` | No placeholder or fake sample content left user-facing |

The following controls permit **N/A only**, with a concrete explanation that
the capability does not exist in this project. If it exists, the control must
be implemented and verified: `SEC-001`, `SEC-003`, `SEC-004`, `SEC-013`,
`SEC-014`, `SEC-016`, `SEC-020`, and `SEC-027`. The checker validates the
recorded form; a reviewer validates the factual claim of non-applicability.

Other 🔴 controls may have a time-bound, approved risk exception. It must name
the exact control ID, explain the risk and mitigation, link the approval
record, and set a review/expiry date. Expiry is a deadline to resolve or
renew the decision, not automatic permission to continue indefinitely.

A first hosted deployment is a separate, temporary state, not a risk exception
or a final release. With a dated release-owner approval record,
`scripts/check-charter.sh --predeploy` defers only `SEC-027` and `OPS-002`
until the real URL can be checked. All other red controls still need evidence
or permitted exceptions. If post-deployment verification fails, roll back;
do not mark the full release gate passed.

This project's roles are a pragmatic adaptation of the principle that risk
acceptance belongs to an accountable authorizing official, described in the
[NIST Risk Management Framework](https://csrc.nist.gov/Projects/risk-management/about-rmf/authorize-step).
