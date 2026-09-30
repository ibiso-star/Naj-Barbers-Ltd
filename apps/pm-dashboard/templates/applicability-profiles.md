# Applicability profiles

Choose one starting profile in `PRD.md` section 0, then adjust it for the
actual product. This is a prompt for a coherent intake, not permission to
delete a control. State every excluded control set and its reason in section 0.
For an individual 🔴 control that remains open at release because it does not
apply, use its ID in the section 11 exception table with the named release
owner, approval record, and date. `templates/risk-policy.md` identifies
controls that cannot be excepted at all and those that permit only N/A.

For a static site, `python3 scripts/propose-na.py` produces an unapproved
exact-ID candidate packet from `templates/static-site-na-candidates.md`.
Review every row against the actual project and host; the script does not
change `PRD.md`, checklist status, or release-gate results.

| Profile | Answer in detail | Usually conditional or N/A |
|---|---|---|
| Static site | Identity, audience, brand/assets, content journeys, accessibility, performance, SEO, hosting, privacy/cookies, release proof | Accounts, database, payments, mobile stores, AI/tool actions unless the site actually uses them |
| Web application | All product and data sections; authentication, authorization, security, tests, operations, incident response | Payments, marketplace, native-store, regulated-data controls unless applicable |
| Marketplace | Web application controls plus seller/buyer ownership, payments, fraud/abuse, disputes, moderation, retention, and legal responsibilities | Native-store controls unless distributing a native app |
| Native app | App journeys, device permissions, account deletion, store submission, mobile release checks, API/data controls used by the app | Web-only SEO and browser controls where genuinely inapplicable |

For a hybrid, select the highest-risk applicable profile and list the added
surfaces. An internal tool with sensitive data can need stronger security than
a public static site; the profile name alone is never the final answer.

During intake, leave implementation checkboxes open. The build check accepts
open work. The release check requires evidence or a specific approved exception
for every 🔴 control, including controls declared N/A.
