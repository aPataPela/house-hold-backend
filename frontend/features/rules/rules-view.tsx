"use client";

import { Check, Plus, Scale } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { Category, Member, ParticipationRules, Preference, PreferenceDraft } from "@/lib/domain";
import { dateInputValue } from "@/lib/date";
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
}: RulesViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.categoryId ?? "");
  const activeCategoryId = categories.some((category) => category.categoryId === selectedCategoryId)
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
              return (
                <RuleMemberRow
                  key={`${activeCategoryId}:${member.membershipId}:${preference?.preferenceId ?? "default"}:${preference?.weight ?? 1}`}
                  categoryId={activeCategoryId}
                  member={member}
                  preference={preference}
                  canEdit={canManageHouse || member.membershipId === currentMembershipId}
                  loading={loading}
                  onSetPreference={onSetPreference}
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
  canEdit,
  loading,
  onSetPreference,
}: {
  categoryId: string;
  member: Member;
  preference?: Preference;
  canEdit: boolean;
  loading: boolean;
  onSetPreference: (draft: PreferenceDraft) => Promise<boolean>;
}) {
  const today = dateInputValue();
  const initialValue =
    preference?.weight === 0 ? "0" : preference?.weight === 0.5 ? "0.5" : "1";
  const [participation, setParticipation] = useState(initialValue);

  const savePreference = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const factor = Number(participation);
    await onSetPreference({
      categoryId,
      membershipId: member.membershipId,
      mode: factor === 0 ? "NO_PARTICIPATES" : factor === 0.5 ? "HALF" : "PARTICIPATES",
      validFrom: preference?.validFrom ?? today,
      validTo: preference?.validTo ?? null,
    });
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
          {participationOptions.find((option) => option.value === initialValue)?.label ?? "Participa"}
        </p>
      )}
    </article>
  );
}
