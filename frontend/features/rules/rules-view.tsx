"use client";

import { CalendarOff, Check, Plus, Scale, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type {
  Category,
  CategoryExclusion,
  ExclusionDraft,
  Member,
  ParticipationRules,
  Preference,
  PreferenceDraft,
} from "@/lib/domain";
import { addDays, dateInputValue, formatShortDate } from "@/lib/date";
import { displayMemberName } from "@/lib/format";

const participationOptions = [
  { value: "1", label: "Participa" },
  { value: "0.5", label: "Media" },
  { value: "0", label: "No participa" },
];

type RulesViewProps = {
  categories: Category[];
  members: Member[];
  rules: ParticipationRules;
  currentMembershipId: string;
  canManageHouse: boolean;
  loading: boolean;
  onCreateCategory: (name: string) => Promise<boolean>;
  onSetPreference: (draft: PreferenceDraft) => Promise<boolean>;
  onCreateExclusion: (draft: ExclusionDraft) => Promise<boolean>;
  onCancelExclusion: (exclusionId: string) => Promise<boolean>;
};

export function RulesView({
  categories,
  members,
  rules,
  currentMembershipId,
  canManageHouse,
  loading,
  onCreateCategory,
  onSetPreference,
  onCreateExclusion,
  onCancelExclusion,
}: RulesViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.categoryId ?? "",
  );
  const activeCategoryId = categories.some(
    (category) => category.categoryId === selectedCategoryId,
  )
    ? selectedCategoryId
    : (categories[0]?.categoryId ?? "");

  const preferences = useMemo(
    () =>
      new Map(
        rules.preferences
          .filter((item) => item.categoryId === activeCategoryId)
          .map((item) => [item.membershipId, item]),
      ),
    [activeCategoryId, rules.preferences],
  );

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    if (await onCreateCategory(name)) event.currentTarget.reset();
  };

  return (
    <section data-tutorial="rules">
      <div className="page-heading">
        <p className="eyebrow">Reparto automático</p>
        <h2>Reglas de la casa</h2>
      </div>

      {canManageHouse && (
        <form className="category-creator" onSubmit={createCategory}>
          <label>
            Nueva categoría
            <span>
              <input name="name" placeholder="Feria, gas, internet" required />
              <button
                className="icon-action primary-icon"
                aria-label="Crear categoría"
                title="Crear categoría"
              >
                <Plus size={19} />
              </button>
            </span>
          </label>
        </form>
      )}

      {categories.length === 0 ? (
        <div className="empty-illustration">
          <Scale size={30} aria-hidden="true" />
          <h3>Sin categorías todavía</h3>
          <p>
            {canManageHouse
              ? "Crea la primera para definir el reparto."
              : "Un administrador debe crear la primera categoría."}
          </p>
        </div>
      ) : (
        <>
          <label className="category-picker">
            Categoría
            <select
              value={activeCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option value={category.categoryId} key={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="rules-list">
            {members.map((member) => {
              const preference = preferences.get(member.membershipId);
              const exclusions = rules.exclusions.filter(
                (item) =>
                  item.categoryId === activeCategoryId &&
                  item.membershipId === member.membershipId,
              );
              return (
                <RuleMemberRow
                  key={`${activeCategoryId}:${member.membershipId}:${preference?.preferenceId ?? "default"}:${preference?.weight ?? 1}`}
                  categoryId={activeCategoryId}
                  member={member}
                  preference={preference}
                  exclusions={exclusions}
                  canEdit={
                    canManageHouse ||
                    member.membershipId === currentMembershipId
                  }
                  loading={loading}
                  onSetPreference={onSetPreference}
                  onCreateExclusion={onCreateExclusion}
                  onCancelExclusion={onCancelExclusion}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function RuleMemberRow({
  categoryId,
  member,
  preference,
  exclusions,
  canEdit,
  loading,
  onSetPreference,
  onCreateExclusion,
  onCancelExclusion,
}: {
  categoryId: string;
  member: Member;
  preference?: Preference;
  exclusions: CategoryExclusion[];
  canEdit: boolean;
  loading: boolean;
  onSetPreference: (draft: PreferenceDraft) => Promise<boolean>;
  onCreateExclusion: (draft: ExclusionDraft) => Promise<boolean>;
  onCancelExclusion: (exclusionId: string) => Promise<boolean>;
}) {
  const today = dateInputValue();
  const initialValue =
    preference?.weight === 0 ? "0" : preference?.weight === 0.5 ? "0.5" : "1";
  const [participation, setParticipation] = useState(initialValue);
  const [showPause, setShowPause] = useState(false);

  const savePreference = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const factor = Number(participation);
    await onSetPreference({
      categoryId,
      membershipId: member.membershipId,
      mode:
        factor === 0 ? "NO_PARTICIPATES" : factor === 0.5 ? "HALF" : "PARTICIPATES",
      validFrom: preference?.validFrom ?? today,
      validTo: preference?.validTo ?? null,
    });
  };

  const createExclusion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    const saved = await onCreateExclusion({
      categoryId,
      membershipId: member.membershipId,
      periodStart: String(form.get("periodStart")),
      periodEnd: String(form.get("periodEnd")),
      ...(reason ? { reason } : {}),
    });
    if (saved) setShowPause(false);
  };

  return (
    <article className="rule-row">
      <div className="rule-member">
        <span>{displayMemberName(member).slice(0, 1).toUpperCase()}</span>
        <div>
          <h3>{displayMemberName(member)}</h3>
          <p>{member.role === "ADMIN" ? "Administrador" : "Integrante"}</p>
        </div>
      </div>

      {canEdit ? (
        <form className="rule-form" onSubmit={savePreference}>
          <select
            aria-label={`Participación de ${displayMemberName(member)}`}
            value={participation}
            onChange={(event) => setParticipation(event.target.value)}
          >
            {participationOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="icon-action"
            aria-label="Guardar regla"
            title="Guardar regla"
            disabled={loading}
          >
            <Check size={18} />
          </button>
        </form>
      ) : (
        <p className="read-only-rule">
          {participationOptions.find((option) => option.value === initialValue)
            ?.label ?? "Participa"}
        </p>
      )}

      {exclusions.length > 0 && (
        <div className="pause-list">
          {exclusions.map((exclusion) => (
            <div className="pause-row" key={exclusion.exclusionId}>
              <CalendarOff size={17} aria-hidden="true" />
              <span>
                {exclusion.periodStart > today ? "Próxima" : "En pausa"} ·{" "}
                {formatShortDate(exclusion.periodStart)}–
                {formatShortDate(exclusion.periodEnd)}
              </span>
              {canEdit && (
                <button
                  className="icon-action quiet-icon"
                  type="button"
                  aria-label="Cancelar pausa"
                  title="Cancelar pausa"
                  disabled={loading}
                  onClick={() => void onCancelExclusion(exclusion.exclusionId)}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && !showPause && (
        <button
          className="text-action pause-trigger"
          type="button"
          onClick={() => setShowPause(true)}
        >
          <CalendarOff size={17} /> Pausar temporalmente
        </button>
      )}
      {canEdit && showPause && (
        <form className="pause-form" onSubmit={createExclusion}>
          <div className="date-pair">
            <label>
              Desde
              <input
                name="periodStart"
                type="date"
                defaultValue={today}
                required
              />
            </label>
            <label>
              Hasta
              <input
                name="periodEnd"
                type="date"
                defaultValue={addDays(today, 7)}
                required
              />
            </label>
          </div>
          <label>
            Motivo <span className="optional-label">Opcional</span>
            <input name="reason" maxLength={120} placeholder="Ej. viaje" />
          </label>
          <div className="form-actions">
            <button
              className="text-action"
              type="button"
              onClick={() => setShowPause(false)}
            >
              Cancelar
            </button>
            <button className="soft-action" disabled={loading}>
              Guardar pausa
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
