import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
    label: string;
    description?: string;
}

export interface StepperProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (step: number) => void;
    orientation?: "horizontal" | "vertical";
    className?: string;
}

export function Stepper({
    steps,
    currentStep,
    onStepClick,
    orientation = "horizontal",
    className,
}: StepperProps) {
    const isClickable = !!onStepClick;

    if (orientation === "vertical") {
        return (
            <div className={cn("space-y-4", className)}>
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                        <div key={index} className="flex gap-4">
                            {/* Step indicator */}
                            <div className="flex flex-col items-center">
                                <button
                                    type="button"
                                    onClick={() => isClickable && onStepClick(index)}
                                    disabled={!isClickable || isPending}
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                                        isCompleted && "border-[var(--color-success)] bg-[var(--color-success)] text-white",
                                        isCurrent && "border-[var(--color-accent)] bg-[var(--color-accent)] text-white",
                                        isPending && "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
                                        isClickable && !isPending && "cursor-pointer hover:opacity-80"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </button>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "mt-2 h-8 w-0.5",
                                            isCompleted
                                                ? "bg-[var(--color-success)]"
                                                : "bg-[var(--color-border)]"
                                        )}
                                    />
                                )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 pb-4">
                                <p
                                    className={cn(
                                        "font-medium",
                                        isCurrent
                                            ? "text-[var(--color-accent)]"
                                            : isCompleted
                                                ? "text-[var(--color-text)]"
                                                : "text-[var(--color-text-muted)]"
                                    )}
                                >
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p className="mt-0.5 text-sm text-[var(--color-text-subtle)]">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Horizontal orientation (default)
    return (
        <div className={cn("flex items-start justify-between", className)}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => isClickable && onStepClick(index)}
                                disabled={!isClickable || isPending}
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                                    isCompleted && "border-[var(--color-success)] bg-[var(--color-success)] text-white",
                                    isCurrent && "border-[var(--color-accent)] bg-[var(--color-accent)] text-white",
                                    isPending && "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
                                    isClickable && !isPending && "cursor-pointer hover:opacity-80"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    index + 1
                                )}
                            </button>
                            <div className="mt-2 text-center">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        isCurrent
                                            ? "text-[var(--color-accent)]"
                                            : isCompleted
                                                ? "text-[var(--color-text)]"
                                                : "text-[var(--color-text-muted)]"
                                    )}
                                >
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p className="mt-0.5 text-xs text-[var(--color-text-subtle)]">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div className="mt-5 flex-1 px-4">
                                <div
                                    className={cn(
                                        "h-0.5 w-full",
                                        isCompleted
                                            ? "bg-[var(--color-success)]"
                                            : "bg-[var(--color-border)]"
                                    )}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

Stepper.displayName = "Stepper";
