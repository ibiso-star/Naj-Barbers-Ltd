# Static-site N/A candidates

These rows are prompts for factual review, not pre-approved exceptions. Include
only controls whose named capability is actually absent. Review repository and
host capabilities separately from site code.

| Control ID | Candidate reason to verify | Reopen trigger / mitigation |
|---|---|---|
| SEC-001 | No protected route, account, or gated content exists. | Review before adding protected content or login. |
| SEC-002 | Site code creates no session token. | Review storage and cookies before adding identity. |
| SEC-003 | No user-owned object or authenticated object request exists. | Add object-level authorization before a data API. |
| SEC-004 | No client create/update endpoint or privilege field exists. | Define server-side allowlists before writes. |
| SEC-005 | No custom staff/admin function or privileged site action exists. | If added, require MFA and server-side authorization for every privileged action; review repository access separately. |
| SEC-012 | No application account or visitor record exists for in-app deletion. | Review host metadata rights separately; add deletion before collecting user data. |
| SEC-013 | No submitted input reaches server storage or later rendering. | Add validation and output encoding before forms or APIs. |
| SEC-014 | No SQL, authenticated state change, or user-supplied HTML exists. | Reassess injection, XSS, and CSRF if dynamic input is introduced. |
| SEC-015 | No file-upload endpoint exists. | Add file validation before uploads. |
| SEC-016 | No price, quantity, or payment flow exists. | Put financial authority on a server before transactions. |
| SEC-019 | Site code produces no credential-bearing application logs. | Review logging before adding authentication or server code. |
| SEC-020 | Site code requires no runtime secret. | Use secret management before a secret-dependent service is added. |
| SEC-028 | No database, private backup, or private file store exists. | Review encryption when private storage is introduced. |
| SEC-029 | No application IAM role, database permission, or service identity exists. | Review host access now and least privilege when services are added. |
| SEC-030 | No attackable authentication, search, payment, upload, or write route exists. | Review host abuse protection now and thresholds before adding such routes. |
| SEC-037 | No runtime LLM, retrieval system, agent tool, or automated action exists. | Threat-model prompt injection before adding AI actions. |
| SEC-038 | No site feature executes AI-generated code or actions at runtime. | Require sandboxing or review before such a feature. |
| OPS-003 | No database exists to back up or restore. | Exercise source recovery; add restore testing with a database. |
| MOB-001 | No iOS app is distributed. | Reopen before App Store submission. |
| MOB-002 | No iOS app or in-app account exists. | Reopen before iOS account creation. |
| MOB-003 | No iOS app or third-party social login exists. | Recheck store rules before adding either. |
| MOB-004 | No iOS app or paywall exists. | Reopen before in-app purchase. |
| MOB-008 | No Android app is distributed. | Reopen before Play Store submission. |
| MOB-009 | No Android app is distributed. | Complete Data Safety review before Play submission. |
| MOB-010 | No Android app or in-app account exists. | Reopen before Android account creation. |
| LEGAL-009 | The site handles no sensitive, medical, safety, minors', payment, or regulated activity. | Reassess legal review when scope changes. |
