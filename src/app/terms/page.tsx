import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { SHOP_SETTINGS, NO_SHOW_LIMIT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Naj Barbers Ltd",
  description:
    "The terms that apply when you book an appointment with Naj Barbers Ltd.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      lastUpdated="15 September 2026"
    >
      <p>
        These terms apply whenever you book an appointment with Naj Barbers
        Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;), company number{" "}
        {SHOP_SETTINGS.companyNumber}, of {SHOP_SETTINGS.address} — whether
        online, by phone, or in person — and whenever you use our website.
        By booking with us, you agree to these terms. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link>, which explains how we
        handle your personal data.
      </p>

      <h2>1. Bookings</h2>
      <p>
        You can book a service through our website, by phone, or by
        speaking to us in the shop. Please make sure the contact details
        and appointment details you give us are accurate — we use them to
        confirm and manage your booking.
      </p>

      <h2>2. Prices and payment</h2>
      <p>
        Prices are shown on our <Link href="/services">Services</Link>{" "}
        page and are correct at the time of booking, but may change from
        time to time. Depending on the service, you can either:
      </p>
      <ul>
        <li>pay in full online at the time of booking (via Stripe), or</li>
        <li>pay in shop at the time of your appointment.</li>
      </ul>
      <p>We do not require a deposit for any service.</p>

      <h2>3. Cancellations and rescheduling</h2>
      <p>
        You can cancel or reschedule free of charge up to{" "}
        {SHOP_SETTINGS.cancellationWindowHours} hours before your
        appointment. If you cancel a prepaid (full-payment) booking within{" "}
        {SHOP_SETTINGS.cancellationWindowHours} hours of the appointment, or
        don&rsquo;t show up, that payment is non-refundable. If you paid in
        shop and cancel late or don&rsquo;t show up, we may ask you to
        prepay for your next booking.
      </p>

      <h2>4. No-show policy</h2>
      <p>
        If you miss {NO_SHOW_LIMIT} or more appointments without cancelling
        in advance, we&rsquo;ll flag your account so that future bookings
        need to be paid for online in advance. This is to keep appointment
        slots fairly available for everyone.
      </p>

      <h2>5. Arriving late</h2>
      <p>
        We&rsquo;ll always do our best for you, but arriving significantly
        late may mean we need to shorten your service to stay on schedule
        for other customers, or treat the appointment as a late
        cancellation if there isn&rsquo;t enough time left to carry it out
        safely.
      </p>

      <h2>6. Children&rsquo;s appointments</h2>
      <p>
        We&rsquo;re happy to welcome children for our kids&rsquo; cut
        service. A parent or guardian must make the booking, stay on the
        premises for the appointment, and let us know about any allergies,
        sensitivities, or particular needs beforehand.
      </p>

      <h2>7. Conduct</h2>
      <p>
        We want our shop to be a welcoming, safe space for customers and
        staff. We reserve the right to refuse or end a service for anyone
        behaving in a threatening, abusive, or unsafe way.
      </p>

      <h2>8. Our liability</h2>
      <p>
        We provide every service with reasonable skill and care. We
        aren&rsquo;t responsible for a reaction to a product where you knew
        about a relevant allergy or sensitivity and didn&rsquo;t tell us
        beforehand. Nothing in these terms limits our liability for death
        or personal injury caused by our negligence, or for fraud, where
        the law doesn&rsquo;t allow us to.
      </p>

      <h2>9. Website content</h2>
      <p>
        The text, images, and design on this website belong to Naj Barbers
        Ltd (or are used with permission) and shouldn&rsquo;t be copied or
        reused without asking us first.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms occasionally — for example, if our
        policies change. The &ldquo;last updated&rdquo; date above will
        always reflect the current version.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales, and any
        dispute will be handled by the courts of England and Wales.
      </p>

      <h2>12. Contact us</h2>
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
