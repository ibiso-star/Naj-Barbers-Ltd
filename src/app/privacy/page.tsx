import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { SHOP_SETTINGS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Naj Barbers Ltd",
  description:
    "How Naj Barbers Ltd collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated="15 September 2026"
    >
      <p>
        Naj Barbers Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
        company number {SHOP_SETTINGS.companyNumber}, of{" "}
        {SHOP_SETTINGS.address}, is committed to protecting your privacy.
        This policy explains what personal data we collect when you use our
        website or book an appointment, why we collect it, who we share it
        with, and the rights you have over it under UK data protection law
        (the UK GDPR and the Data Protection Act 2018).
      </p>

      <h2>1. Who this policy covers</h2>
      <p>
        This policy applies to customers booking or enquiring about an
        appointment through our website, phone, or in person, and to
        visitors browsing najbarbers.com. It does not cover our employment
        records for staff, which are held under a separate internal policy.
      </p>

      <h2>2. What we collect</h2>
      <p>When you book an appointment or create an account, we collect:</p>
      <ul>
        <li>Your name, email address, and phone number.</li>
        <li>
          Appointment details: the service and barber selected, date and
          time, and any notes you add (for example, a style request or a
          known allergy).
        </li>
        <li>
          Your booking and attendance history, including cancellations and
          no-shows, so we can apply our{" "}
          <Link href="/terms">cancellation policy</Link> fairly.
        </li>
      </ul>
      <p>
        If you pay online, your payment is handled directly by Stripe, our
        payment processor. We do not receive or store your full card
        details — only confirmation that a payment succeeded and the amount
        paid. If you pay in shop, no online payment data is collected.
      </p>
      <p>
        If you book a children&rsquo;s cut, the booking and any notes are
        provided by the parent or guardian making the booking; we do not
        knowingly collect personal data directly from children.
      </p>

      <h2>3. Cookies and analytics</h2>
      <p>
        Our website currently uses only cookies that are strictly necessary
        to run it — for example, keeping you signed in to manage your
        appointments. We do not currently use non-essential analytics or
        advertising cookies. If we add analytics in future, we will update
        this policy and ask for your consent before any non-essential
        cookie is set, in line with UK PECR rules.
      </p>

      <h2>4. Why we use your data</h2>
      <ul>
        <li>
          <strong>To provide the service you asked for</strong> — booking,
          confirming, and managing your appointment (performance of a
          contract with you).
        </li>
        <li>
          <strong>To run the shop fairly and safely</strong> — enforcing our
          cancellation and no-show policy, and preventing abuse of the
          booking system (our legitimate interest).
        </li>
        <li>
          <strong>To meet our legal obligations</strong> — for example,
          keeping financial records for tax purposes.
        </li>
        <li>
          <strong>To send you appointment confirmations and reminders</strong>{" "}
          by email (performance of a contract). We will only send you
          marketing about offers or promotions if you separately opt in,
          and you can withdraw that consent at any time.
        </li>
      </ul>

      <h2>5. Who we share it with</h2>
      <p>
        We share the minimum data necessary with a small number of service
        providers who help us run the booking system, and we require them
        to protect your data:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — hosts our database and handles
          account sign-in.
        </li>
        <li>
          <strong>Stripe</strong> — processes online payments.
        </li>
        <li>
          <strong>Vercel</strong> — hosts the website itself.
        </li>
        <li>
          <strong>Resend</strong> — sends booking confirmation and reminder
          emails.
        </li>
      </ul>
      <p>
        Some of these providers may process data on servers outside the UK
        or EU. Where that happens, we rely on their standard contractual
        clauses or an equivalent recognised safeguard. We do not sell your
        personal data to anyone.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        We keep booking and payment records for as long as needed to meet
        our accounting and tax obligations (currently up to 6 years), and
        account data for as long as your account is active. If you ask us
        to delete your data, we will do so unless we are legally required
        to keep some of it (for example, financial records) — we&rsquo;ll
        tell you what we&rsquo;re keeping and why.
      </p>

      <h2>7. Your rights</h2>
      <p>Under UK data protection law, you have the right to:</p>
      <ul>
        <li>Ask what personal data we hold about you and get a copy of it.</li>
        <li>Ask us to correct inaccurate or incomplete data.</li>
        <li>
          Ask us to delete your data, or restrict or object to certain uses
          of it.
        </li>
        <li>Ask us to move your data to another provider (data portability).</li>
        <li>Withdraw any marketing consent you&rsquo;ve given, at any time.</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href={`mailto:${SHOP_SETTINGS.email}`}>{SHOP_SETTINGS.email}</a>.
        We will respond within one month, as required by law. If you&rsquo;re
        not satisfied with our response, you can complain to the
        Information Commissioner&rsquo;s Office (ICO) at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
          ico.org.uk
        </a>
        .
      </p>

      <h2>8. Keeping your data safe</h2>
      <p>
        We use appropriate technical and organisational measures to protect
        your data, including encrypted connections (HTTPS) and access
        controls on our systems. No online service can be 100% secure, but
        we take reasonable steps to protect your information and to detect
        and respond to any issue quickly.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy from time to time — for example, if we
        add a new feature that changes what data we collect. We&rsquo;ll
        update the &ldquo;last updated&rdquo; date above when we do, and if
        the change is significant we&rsquo;ll make that clear on the
        website.
      </p>

      <h2>10. Contact us</h2>
      <p>
        Naj Barbers Ltd, {SHOP_SETTINGS.address}
        <br />
        Email:{" "}
        <a href={`mailto:${SHOP_SETTINGS.email}`}>{SHOP_SETTINGS.email}</a>
        <br />
        Phone: {SHOP_SETTINGS.phone}
      </p>
    </LegalDocument>
  );
}
