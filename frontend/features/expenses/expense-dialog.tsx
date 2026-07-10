"use client";

import { ReceiptText, Sparkles, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Category, ExpenseDraft } from "@/lib/domain";
import { dateInputValue } from "@/lib/date";

type ExpenseDialogProps = {
  open: boolean;
  categories: Category[];
  payerName: string;
  onClose: () => void;
  onNeedCategory: () => void;
  onSubmit: (draft: ExpenseDraft) => Promise<boolean>;
};

export function ExpenseDialog({
  open,
  categories,
  payerName,
  onClose,
  onNeedCategory,
  onSubmit,
}: ExpenseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      formRef.current?.reset();
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") ?? "").trim();
    setSubmitting(true);
    const saved = await onSubmit({
      categoryId: String(form.get("categoryId")),
      date: String(form.get("date")),
      totalAmount: Number(form.get("totalAmount")),
      ...(note ? { note } : {}),
    });
    setSubmitting(false);
    if (saved) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet-dialog"
      aria-labelledby="expense-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-header">
        <div>
          <p className="eyebrow">Nuevo movimiento</p>
          <h2 id="expense-dialog-title">Registrar gasto</h2>
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

      {categories.length === 0 ? (
        <div className="dialog-empty">
          <ReceiptText size={28} aria-hidden="true" />
          <h3>Primero crea una categoría</h3>
          <button
            className="primary-action"
            type="button"
            onClick={() => {
              onClose();
              onNeedCategory();
            }}
          >
            Ir a Reglas
          </button>
        </div>
      ) : (
        <form ref={formRef} className="expense-form" onSubmit={submit}>
          <label className="amount-field">
            Monto
            <span>
              <small>$</small>
              <input
                name="totalAmount"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                autoFocus
                required
              />
            </span>
          </label>
          <label>
            Categoría
            <select
              name="categoryId"
              required
              defaultValue={categories[0]?.categoryId}
            >
              {categories.map((category) => (
                <option value={category.categoryId} key={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input
              name="date"
              type="date"
              defaultValue={dateInputValue()}
              required
            />
          </label>
          <label>
            Nota <span className="optional-label">Opcional</span>
            <input
              name="note"
              maxLength={160}
              placeholder="Ej. compra semanal"
            />
          </label>
          <div className="expense-meta" aria-label="Datos del reparto">
            <span>
              <UserRound size={17} /> Pagó {payerName}
            </span>
            <span>
              <Sparkles size={17} /> Reparto automático
            </span>
          </div>
          <button className="primary-action full-action" disabled={submitting}>
            <ReceiptText size={19} />
            {submitting ? "Registrando..." : "Registrar gasto"}
          </button>
        </form>
      )}
    </dialog>
  );
}
