"use client";

import { CircleDollarSign, Percent, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Expense, ExpensePaymentDraft } from "@/lib/domain";
import { formatCurrency } from "@/lib/format";
import { formatShortDate } from "@/lib/date";

type PaymentDialogProps = {
  open: boolean;
  expense: Expense | null;
  currentMembershipId?: string;
  categoryName: (id: string) => string;
  memberName: (id: string) => string;
  onClose: () => void;
  onSubmit: (draft: ExpensePaymentDraft) => Promise<boolean>;
};

export function PaymentDialog({
  open,
  expense,
  currentMembershipId,
  categoryName,
  memberName,
  onClose,
  onSubmit,
}: PaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const share = useMemo(() => {
    if (!expense || !currentMembershipId) return null;
    return expense.settlement?.shares.find(
      (item) => item.membershipId === currentMembershipId,
    ) ?? null;
  }, [currentMembershipId, expense]);
  const remainingAmount = share?.remainingAmount ?? 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      formRef.current?.reset();
      if (share) {
        const amountField = formRef.current?.elements.namedItem("amount");
        if (amountField instanceof HTMLInputElement) {
          amountField.value = String(share.remainingAmount || 0);
        }
      }
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, share]);

  if (!expense || !share) return null;
  const isSettled = remainingAmount <= 0;

  const submitAmount = async (amount: number) => {
    if (amount <= 0 || amount > remainingAmount) return;
    setSubmitting(true);
    const saved = await onSubmit({
      membershipId: share.membershipId,
      amount,
    });
    setSubmitting(false);
    if (saved) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitAmount(Number(form.get("amount")));
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet-dialog"
      aria-labelledby="payment-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-header">
        <div>
          <p className="eyebrow">Abono de deuda</p>
          <h2 id="payment-dialog-title">{categoryName(expense.categoryId)}</h2>
        </div>
        <button
          className="icon-action"
          type="button"
          aria-label="Cerrar"
          title="Cerrar"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="payment-summary">
        <p>
          {memberName(expense.payerMembershipId)} ·{" "}
          {formatShortDate(expense.date)}
        </p>
        <strong>
          {isSettled
            ? "Ya está pagado"
            : `${formatCurrency(remainingAmount)} pendiente`}
        </strong>
        <span>
          Tu aporte total: {formatCurrency(share.assignedAmount)} · Ya pagado:{" "}
          {formatCurrency(share.paidAmount)}
        </span>
      </div>

      {isSettled ? (
        <div className="payment-actions settled">
          <button className="primary-action full-action" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      ) : (
        <form ref={formRef} className="expense-form" onSubmit={submit}>
          <label className="amount-field">
            Monto a abonar
            <span>
              <small>$</small>
              <input
                name="amount"
                type="number"
                min="1"
                max={remainingAmount}
                step="1"
                inputMode="numeric"
                defaultValue={remainingAmount}
                required
              />
            </span>
          </label>
          <div className="payment-actions">
            <button
              className="text-action"
              type="button"
              disabled={submitting}
              onClick={() => void submitAmount(remainingAmount)}
            >
              <CircleDollarSign size={18} />
              Pagar todo
            </button>
            <button className="primary-action" disabled={submitting}>
              <Percent size={18} />
              {submitting ? "Guardando..." : "Abonar"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
