import { clsx } from "clsx";

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  isComplete && "bg-gold text-navy",
                  isCurrent && "bg-navy text-white",
                  !isComplete && !isCurrent && "bg-navy/10 text-navy/40"
                )}
              >
                {stepNumber}
              </span>
              <span
                className={clsx(
                  "hidden text-xs font-medium sm:block",
                  isCurrent ? "text-navy" : "text-navy/40"
                )}
              >
                {step}
              </span>
            </div>
            {stepNumber < steps.length && (
              <div
                className={clsx(
                  "mx-2 h-0.5 flex-1",
                  isComplete ? "bg-gold" : "bg-navy/10"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
