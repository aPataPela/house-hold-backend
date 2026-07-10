"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarOff,
  Check,
  Home,
  ReceiptText,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppSection } from "@/lib/domain";
import type { TutorialStep } from "./tutorial-steps";

const sectionIcons = {
  home: Home,
  expenses: ReceiptText,
  rules: SlidersHorizontal,
  absences: CalendarOff,
  house: Users,
} satisfies Record<AppSection, typeof Home>;

type TutorialDialogProps = {
  open: boolean;
  steps: TutorialStep[];
  onSectionChange: (section: AppSection) => void;
  onExit: (status: "completed" | "skipped") => void;
};

export function TutorialDialog({
  open,
  steps,
  onSectionChange,
  onExit,
}: TutorialDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open && step) onSectionChange(step.section);
  }, [open, step, onSectionChange]);

  if (!step) return null;
  const Icon = sectionIcons[step.section];
  const isLast = stepIndex === steps.length - 1;

  return (
    <dialog
      ref={dialogRef}
      className="tutorial-dialog"
      aria-labelledby="tutorial-title"
      onCancel={(event) => {
        event.preventDefault();
        onExit("skipped");
      }}
    >
      <div
        className="tutorial-progress"
        aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}
      >
        {steps.map((item, index) => (
          <span className={index <= stepIndex ? "active" : ""} key={item.id} />
        ))}
      </div>
      <div className="tutorial-icon" aria-hidden="true">
        <Icon size={24} />
      </div>
      <p className="eyebrow">
        Paso {stepIndex + 1} de {steps.length}
      </p>
      <h2 id="tutorial-title">{step.title}</h2>
      <p className="tutorial-message">{step.message}</p>
      <div className="tutorial-actions">
        <button
          className="text-action"
          type="button"
          onClick={() => onExit("skipped")}
        >
          Omitir
        </button>
        <div>
          {stepIndex > 0 && (
            <button
              className="icon-action"
              type="button"
              aria-label="Paso anterior"
              title="Paso anterior"
              onClick={() => setStepIndex((value) => value - 1)}
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <button
            className="primary-action tutorial-next"
            type="button"
            onClick={() => {
              if (isLast) onExit("completed");
              else setStepIndex((value) => value + 1);
            }}
          >
            {isLast ? (
              <>
                <Check size={19} /> Finalizar
              </>
            ) : (
              <>
                Siguiente <ArrowRight size={19} />
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
