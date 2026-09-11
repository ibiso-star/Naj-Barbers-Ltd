"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { clsx } from "clsx";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/Button";
import { fetchAvailableSlots, submitBooking } from "@/app/book/actions";
import type { Barber, Service, TimeSlot } from "@/lib/types";

const STEPS = ["Service", "Barber", "Time", "Details", "Confirm"];
const DAYS_AHEAD = 10;

type PaymentType = "full" | "pay_in_shop";

export function BookingWizard({
  services,
  barbers,
  initialServiceId,
  initialBarberId,
}: {
  services: Service[];
  barbers: Barber[];
  initialServiceId?: string;
  initialBarberId?: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [barberId, setBarberId] = useState(initialBarberId ?? "");
  const [step, setStep] = useState(() => {
    if (initialServiceId && initialBarberId) return 3;
    if (initialServiceId) return 2;
    return 1;
  });
  const [dateISO, setDateISO] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("pay_in_shop");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const service = services.find((s) => s.id === serviceId);
  const barber = barbers.find((b) => b.id === barberId);
  const eligibleBarbers = useMemo(
    () => (serviceId ? barbers.filter((b) => b.serviceIds.includes(serviceId)) : barbers),
    [barbers, serviceId]
  );

  const nextDays = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)),
    []
  );

  useEffect(() => {
    if (!barberId || !serviceId || step !== 3) return;
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for an in-flight fetch this effect owns
    setLoadingSlots(true);
    setSlot(null);
    fetchAvailableSlots({ barberId, serviceId, dateISO }).then((result) => {
      if (ignore) return;
      setSlots(result);
      setLoadingSlots(false);
    });
    return () => {
      ignore = true;
    };
  }, [barberId, serviceId, dateISO, step]);

  function goTo(n: number) {
    setError(null);
    setStep(n);
  }

  function handleSubmit() {
    if (!service || !barber || !slot) return;
    setError(null);

    startSubmit(async () => {
      const result = await submitBooking({
        serviceId: service.id,
        barberId: barber.id,
        startTime: slot.start,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        notes: notes || undefined,
        paymentType,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      router.push(`/book/confirmation/${result.bookingId}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="mt-10">
        {step === 1 && (
          <StepBlock title="Choose a service">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <SelectCard
                  key={s.id}
                  selected={s.id === serviceId}
                  onClick={() => {
                    setServiceId(s.id);
                    if (barberId && !s.id) setBarberId("");
                    goTo(2);
                  }}
                >
                  <p className="font-semibold text-navy">{s.name}</p>
                  <p className="mt-1 text-sm text-navy/60">
                    {s.durationMinutes} min · £{s.priceGbp.toFixed(0)}
                  </p>
                </SelectCard>
              ))}
            </div>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock title="Choose a barber" onBack={() => goTo(1)}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {eligibleBarbers.map((b) => (
                <SelectCard
                  key={b.id}
                  selected={b.id === barberId}
                  onClick={() => {
                    setBarberId(b.id);
                    goTo(3);
                  }}
                >
                  <p className="font-semibold text-navy">{b.name}</p>
                  <p className="mt-1 text-sm text-navy/60">
                    {b.specialties.slice(0, 2).join(", ")} · ★ {b.rating}
                  </p>
                </SelectCard>
              ))}
            </div>
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock title="Pick a date & time" onBack={() => goTo(2)}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {nextDays.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setDateISO(iso)}
                    className={clsx(
                      "flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 text-sm",
                      iso === dateISO
                        ? "border-navy bg-navy text-white"
                        : "border-navy/10 text-navy/70 hover:border-navy/30"
                    )}
                  >
                    <span className="text-xs uppercase">{format(d, "EEE")}</span>
                    <span className="font-semibold">{format(d, "d")}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {loadingSlots ? (
                <p className="text-sm text-navy/50">Loading available times…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-navy/50">
                  No availability that day — try another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => {
                        setSlot(s);
                        goTo(4);
                      }}
                      className={clsx(
                        "rounded-lg border px-3 py-2 text-sm font-medium",
                        slot?.start === s.start
                          ? "border-gold bg-gold/10 text-navy"
                          : "border-navy/10 text-navy/70 hover:border-navy/30"
                      )}
                    >
                      {format(new Date(s.start), "HH:mm")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock title="Your details" onBack={() => goTo(3)}>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                goTo(5);
              }}
            >
              <Field label="Full name">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Notes for your barber (optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. skin fade, leave top 3 inches"
                  className={inputClass}
                />
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium text-navy">Payment</p>
                <div className="flex flex-col gap-2">
                  {service && service.priceGbp > 0 && (
                    <PaymentOption
                      checked={paymentType === "full"}
                      onChange={() => setPaymentType("full")}
                      label={`Pay in full now (£${service.priceGbp.toFixed(0)})`}
                    />
                  )}
                  <PaymentOption
                    checked={paymentType === "pay_in_shop"}
                    onChange={() => setPaymentType("pay_in_shop")}
                    label="Pay in shop"
                  />
                </div>
              </div>

              <Button type="submit" className="mt-2">
                Review booking
              </Button>
            </form>
          </StepBlock>
        )}

        {step === 5 && service && barber && slot && (
          <StepBlock title="Confirm your booking" onBack={() => goTo(4)}>
            <dl className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
              <SummaryRow label="Service" value={`${service.name} (${service.durationMinutes} min)`} />
              <SummaryRow label="Barber" value={barber.name} />
              <SummaryRow
                label="When"
                value={format(new Date(slot.start), "EEEE d MMM, HH:mm")}
              />
              <SummaryRow label="Name" value={name} />
              <SummaryRow label="Contact" value={`${email} · ${phone}`} />
              <SummaryRow
                label="Payment"
                value={
                  paymentType === "pay_in_shop"
                    ? "Pay in shop"
                    : `£${service.priceGbp.toFixed(0)} in full today`
                }
              />
            </dl>

            <p className="mt-4 text-xs text-navy/50">
              Free cancellation up to 4 hours before your appointment. Late
              cancellations of a prepaid booking are non-refundable.
            </p>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              className="mt-6 w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirming…" : "Confirm booking"}
            </Button>
          </StepBlock>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy";

function StepBlock({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-navy/50 hover:text-navy"
          >
            ← Back
          </button>
        )}
        <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border p-4 text-left transition",
        selected ? "border-gold bg-gold/10" : "border-navy/10 hover:border-navy/30"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-navy">{label}</span>
      {children}
    </label>
  );
}

function PaymentOption({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm",
        checked ? "border-navy bg-navy/5" : "border-navy/10"
      )}
    >
      <input type="radio" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-navy/50">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
