# Design Brief — {{PAGE_OR_FEATURE_NAME}}

> **How to use this file:** copy it into the project (e.g. `docs/design/{{page-slug}}.md`)
> once per landing page, marketing site, or major user-facing surface — not
> once per project. It captures the intake answers and decisions a design
> skill (starting with `skills/landing-page-design/SKILL.md`) produces, so
> they're a durable artifact instead of only existing in a chat log
> (`PRD.md` 8.11 requires exactly this). `PRD.md` section 3 holds this
> project's *brand* decisions once; this file holds one *page's* design
> brief and is expected to exist multiple times across a project.
>
> Fill in every `{{PLACEHOLDER}}`. If a skill other than
> `landing-page-design` produced this brief, name it in the header and skip
> any section that skill doesn't cover — don't leave the section's
> placeholders looking like unmade decisions.
>
> **Project rules override the vendored design skill.** Use the established
> brand and supplied assets. Do not invent customers, testimonials, logos,
> performance numbers, or other proof to make a page look complete. If proof
> is unavailable, omit the claim or label an illustration plainly.

**Skill used:** {{SKILL_NAME}} (e.g. `landing-page-design`)
**Date:** {{DATE}}
**Owner:** {{OWNER}}

---

## 0. Brand source of truth `[COMPLETE FIRST]`

This section exists because a design skill's default visual system (fonts,
colors, spacing, motion) is a *fallback for projects with no brand yet*, not
an override of one that already exists. Get this wrong and the page ships
off-brand.

- **Does this project have an established brand already defined?**
  {{HAS_BRAND}} — yes (link `PRD.md` section 3 or a brand skill/guide) / no
- **If yes:** brand decisions below (palette, typography, tone, iconography)
  are sourced from {{BRAND_SOURCE_LINK}} and take precedence over any
  default in the design skill used. Record where they actually differ from
  the skill's defaults in section 5 below, so the deviation is visible
  rather than silently overridden.
- **Approved logo files:** {{LOGO_FILES}}
- **Logo placement, background, and variant rules:** {{LOGO_USAGE}}
- **Other supplied assets and rights:** {{VISUAL_ASSETS}}
- **If no:** the design skill's own defaults apply as stated in section 5,
  and should be promoted into `PRD.md` section 3 once decided, so the next
  page built for this project inherits them instead of re-deciding.

---

## 1. Intake (Part A1 of `landing-page-design`, or the equivalent for another skill)

**Purpose**
- Primary action: {{PRIMARY_ACTION}} — trial, demo, buy, waitlist, download
- Offer: {{OFFER}} — exactly what they get
- Conversion definition: {{CONVERSION_DEFINITION}} — click, signup, purchase

**Audience and context**
- ICP: {{ICP}}
- Problem being solved: {{PROBLEM}}
- Top three objections (why they don't convert today): {{OBJECTIONS}}
- Traffic source: {{TRAFFIC_SOURCE}} — ads, search, social, email
- What visitors already know on arrival: {{VISITOR_CONTEXT}}

**Proof and assets**
- Proof points: {{PROOF_POINTS}} — cite real sources for logos, testimonials,
  numbers, and case studies; write "none yet" when none can be verified
- Media: {{MEDIA}} — screenshots, demo video, product GIFs
- Guarantees/terms: {{GUARANTEES}}

**Constraints**
- Brand voice: {{BRAND_VOICE}} — casual or professional
- Design direction: {{DESIGN_DIRECTION}} — minimal editorial, playful 3D, glass UI, etc.
- Mobile priority: {{MOBILE_PRIORITY}}

Any answer the stakeholder couldn't give should be marked
`ASSUMED — {{reason}}` rather than left blank, per the skill's own rule
(don't stall the build on an unanswered question).

---

## 2. Layout & structure

- **Layout type chosen:** {{LAYOUT_TYPE}} (A. Classic hero+sections / B. Long-form story / C. Minimal conversion / D. Comparison) — **why:** {{LAYOUT_REASON}}
- **Page outline:** {{PAGE_OUTLINE}} — section order, above-the-fold through final CTA
- **SEO/AEO decision:** {{INDEX_DECISION}} — index or noindex, and why; if indexed: title/meta below

  - Title: {{SEO_TITLE}}
  - Meta description: {{SEO_META}}

---

## 3. Copy decisions

- **Hero:** headline {{HEADLINE}} / subheadline {{SUBHEADLINE}} / CTA {{CTA}} / proof line {{PROOF_LINE}}
- **Benefits (3–5, outcome-driven):** {{BENEFITS}}
- **How it works (3 steps):** {{HOW_IT_WORKS}}
- **FAQ (6–12 Q&A):** {{FAQ}}
- **Tagline reveal section copy** (if the skill mandates one): {{TAGLINE_COPY}}

---

## 4. Proof & risk reversal

- **Proof placement:** {{PROOF_PLACEMENT}} — confirm proof sits next to the claim it supports, not buried at the bottom
- **Risk reversal offered:** {{RISK_REVERSAL}} — free trial, free plan, no card required, cancel anytime, money-back guarantee (at least one)

---

## 5. Visual system resolution

Record what was **actually used**, not just cited — this is the record that
makes section 0's precedence rule checkable later.

| Token | Source (brand / skill default) | Value used |
|---|---|---|
| Typeface | {{TYPEFACE_SOURCE}} | {{TYPEFACE_VALUE}} |
| Color palette | {{PALETTE_SOURCE}} | {{PALETTE_VALUE}} |
| Spacing scale | {{SPACING_SOURCE}} | {{SPACING_VALUE}} |
| Corner radius | {{RADIUS_SOURCE}} | {{RADIUS_VALUE}} |
| Icon set | {{ICON_SOURCE}} | {{ICON_VALUE}} |
| Motion/transition style | {{MOTION_SOURCE}} | {{MOTION_VALUE}} |

If any row's source is "brand" and it overrides a skill default, note the
override explicitly: {{OVERRIDE_NOTES}}

---

## 6. Ship requirements (skill's own pre-launch list)

- [ ] Privacy policy and terms links in footer
- [ ] Custom branded 404
- [ ] Client-side form validation (email format, required fields)
- [ ] Skip-to-content link for keyboard users
- [ ] Cookie consent where jurisdiction requires it (ties to `PRD.md` 8.9)
- [ ] Branded favicon
- [ ] `<title>`, meta description, `og:image`, social sharing tags
- [ ] Alt text on every meaningful image
- [ ] Semantic HTML landmarks
- [ ] Hover / active / focus / loading / empty / error states present on every interactive element
- [ ] No dead links; current nav item indicated
- [ ] No Lorem Ipsum, placeholder brands, AI clichés, or round fake numbers left in

---

## 7. Sign-off

| Area | Decision/evidence | Reviewer | Date |
|---|---|---|---|
| Brand precedence (section 0) | {{EVIDENCE}} | {{REVIEWER}} | {{DATE}} |
| Copy & structure | {{EVIDENCE}} | {{REVIEWER}} | {{DATE}} |
| Visual system | {{EVIDENCE}} | {{REVIEWER}} | {{DATE}} |
| Ship requirements | {{EVIDENCE}} | {{REVIEWER}} | {{DATE}} |

Cross-check against `DESIGN_REVIEW_RUBRIC.md` before launch — that file
audits the decisions made here; it doesn't make them.
