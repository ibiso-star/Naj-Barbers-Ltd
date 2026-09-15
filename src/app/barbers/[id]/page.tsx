import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { getBarberById, getReviewsForBarber } from "@/lib/data";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const barber = await getBarberById(id);
  return { title: barber ? `${barber.name} | Naj Barbers Ltd` : "Barber not found" };
}

export default async function BarberProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const barber = await getBarberById(id);

  if (!barber) notFound();

  const reviews = await getReviewsForBarber(barber.id);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-navy text-4xl font-display font-semibold text-gold">
          {barber.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={barber.photoUrl}
              alt={barber.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            barber.name.charAt(0)
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{barber.name}</h1>
          <p className="mt-1 text-navy/60">{barber.specialties.join(" · ")}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-navy/70">
            {barber.reviewCount > 0 ? (
              <>
                <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
                <span className="font-semibold text-navy">{barber.rating}</span>
                <span>
                  ({barber.reviewCount} reviews) · {barber.yearsExperience} yrs
                  experience
                </span>
              </>
            ) : (
              <span>{barber.yearsExperience} yrs experience</span>
            )}
          </div>
          <Button href={`/book?barber=${barber.id}`} className="mt-4">
            Book with {barber.name}
          </Button>
        </div>
      </div>

      <p className="mt-8 max-w-2xl text-navy/70">{barber.bio}</p>

      <h2 className="font-display mt-10 text-xl font-semibold text-navy">
        Portfolio
      </h2>
      {barber.portfolio.length === 0 ? (
        <p className="mt-2 text-sm text-navy/50">
          Portfolio photos coming soon.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {barber.portfolio.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="aspect-square rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      <h2 className="font-display mt-10 text-xl font-semibold text-navy">
        Reviews
      </h2>
      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description={`Be the first to review a cut with ${barber.name}.`}
        />
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-navy/10 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy">
                  {review.customerName}
                </span>
                <span className="flex items-center gap-1 text-sm text-gold">
                  <Star className="h-4 w-4 fill-gold" aria-hidden />
                  {review.rating}
                </span>
              </div>
              <p className="mt-2 text-sm text-navy/70">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
