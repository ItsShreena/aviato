/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Search, User, Armchair, ShieldCheck, CheckCircle2 } from 'lucide-react';

export type BookingStep = 'search' | 'passenger' | 'seat' | 'review' | 'confirmed';

interface BookingProgressBarProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
}

interface StepItem {
  id: BookingStep;
  stepNumber: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  { id: 'search', stepNumber: 1, label: 'Search', icon: Search },
  { id: 'passenger', stepNumber: 2, label: 'Passenger', icon: User },
  { id: 'seat', stepNumber: 3, label: 'Seat', icon: Armchair },
  { id: 'review', stepNumber: 4, label: 'Review', icon: ShieldCheck },
  { id: 'confirmed', stepNumber: 5, label: 'Confirmed', icon: CheckCircle2 },
];

export default function BookingProgressBar({
  currentStep,
  onStepClick,
}: BookingProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav
      id="booking-progress-indicator"
      aria-label="Booking Progress"
      className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 select-none"
    >
      <ol className="flex items-center justify-between w-full">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const isLast = index === STEPS.length - 1;

          // Steps before current can be clicked to safely navigate backward
          const isClickable = isCompleted && onStepClick && currentStep !== 'confirmed';

          return (
            <React.Fragment key={step.id}>
              <li
                className="relative z-10 flex flex-col items-center group shrink-0"
              >
                <button
                  type="button"
                  id={`booking-step-${step.id}`}
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${step.stepNumber}: ${step.label} (${
                    isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'
                  })`}
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs font-bold transition-all duration-200 outline-none ${
                    isCompleted
                      ? 'bg-navy-900 text-sky-400 hover:bg-sky-500 hover:text-navy-950 cursor-pointer shadow-sm ring-2 ring-sky-400/50'
                      : isCurrent
                      ? 'bg-sky-500 text-navy-950 ring-4 ring-sky-200 scale-110 shadow-md font-extrabold'
                      : 'bg-white text-slate-400 border-2 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <span className="font-mono">{step.stepNumber}</span>
                    </span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={`mt-1.5 text-[11px] sm:text-xs font-semibold tracking-tight transition-colors text-center whitespace-nowrap ${
                    isCurrent
                      ? 'text-navy-950 font-bold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.label.slice(0, 4)}</span>
                </span>
              </li>

              {/* Connecting line between steps ONLY - completely omitted after the final step (Confirmed) */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="flex-1 h-0.5 mx-1 sm:mx-2.5 bg-slate-200 rounded-full overflow-hidden self-start mt-4 sm:mt-5"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      index < currentIndex ? 'bg-sky-500 w-full' : 'bg-transparent w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
