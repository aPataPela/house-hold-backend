"use client";

import { memo, type HTMLAttributes, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, TriangleAlert } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  FormField,
  IconButton,
  Modal,
  Select,
} from "./primitives";
import { cx } from "./utils";
import { ThemeArtwork } from "./theme/theme-visuals";
import type { ThemeEmptyStateSlot } from "./theme/theme-assets";

export { FormField } from "./primitives";

export interface MonthOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MonthSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  value: string;
  months: MonthOption[];
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const MonthSelector = memo(function MonthSelector({
  label = "Month",
  value,
  months,
  onChange,
  loading = false,
  disabled = false,
  className,
}: MonthSelectorProps) {
  const currentIndex = Math.max(
    0,
    months.findIndex((month) => month.value === value),
  );
  const previous = months[currentIndex - 1];
  const next = months[currentIndex + 1];

  return (
    <Card className={cx("ds-month-selector", className)} padding="md">
      <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ds-space-2)" }}>
          <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
            <strong>{label}</strong>
            {loading ? <span className="ds-field-hint">Loading months…</span> : null}
          </div>
          <div style={{ display: "flex", gap: "var(--ds-space-2)" }}>
            <IconButton
              icon={<ChevronLeft size={18} />}
              label="Previous month"
              disabled={disabled || !previous}
              onClick={() => previous && onChange(previous.value)}
            />
            <IconButton
              icon={<ChevronRight size={18} />}
              label="Next month"
              disabled={disabled || !next}
              onClick={() => next && onChange(next.value)}
            />
          </div>
        </div>
        <Select
          label={undefined}
          value={value}
          disabled={disabled}
          options={months}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Card>
  );
});
MonthSelector.displayName = "MonthSelector";

export interface MemberSelectorItem {
  id: string;
  label: string;
  description?: string;
  avatarUrl?: string;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface MemberSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  members: MemberSelectorItem[];
  onChange: (value: string) => void;
  loading?: boolean;
}

export const MemberSelector = memo(function MemberSelector({
  label = "Member",
  hint,
  error,
  value,
  members,
  onChange,
  loading = false,
  className,
}: MemberSelectorProps) {
  return (
    <div className={cx("ds-member-selector", className)}>
      <FormField label={label} hint={hint} error={error} loading={loading}>
        <div role="radiogroup" aria-label={label} style={{ display: "grid", gap: "var(--ds-space-2)" }}>
          {members.map((member) => {
            const selected = member.id === value;
            return (
              <button
                key={member.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={member.disabled}
                data-selected={selected ? "true" : undefined}
                className="ds-member-selector__option"
                onClick={() => onChange(member.id)}
              >
                <Avatar name={member.label} src={member.avatarUrl} size={40} />
                <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
                  <strong>{member.label}</strong>
                  {member.description ? <span className="ds-field-hint">{member.description}</span> : null}
                </div>
                {member.badge ? <div>{member.badge}</div> : null}
              </button>
            );
          })}
        </div>
      </FormField>
    </div>
  );
});
MemberSelector.displayName = "MemberSelector";

export interface FilterBarItem {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  items: FilterBarItem[];
  value: string[];
  onChange: (values: string[]) => void;
  loading?: boolean;
}

export const FilterBar = memo(function FilterBar({
  label = "Filters",
  items,
  value,
  onChange,
  loading = false,
  className,
}: FilterBarProps) {
  return (
    <div className={cx("ds-filter-bar", className)} aria-label={label} role="toolbar">
      {loading ? <Badge tone="neutral">Loading…</Badge> : null}
      {items.map((item) => {
        const active = value.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            className="ds-chip"
            data-active={active ? "true" : undefined}
            disabled={item.disabled}
            onClick={() =>
              onChange(active ? value.filter((current) => current !== item.value) : [...value, item.value])
            }
          >
            <span>{item.label}</span>
            {typeof item.count === "number" ? <Badge tone="neutral">{item.count}</Badge> : null}
          </button>
        );
      })}
    </div>
  );
});
FilterBar.displayName = "FilterBar";

export interface SummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string;
  helperText?: string;
  badge?: ReactNode;
  icon?: ReactNode;
}

export const SummaryCard = memo(function SummaryCard({
  title,
  value,
  helperText,
  badge,
  icon,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cx("ds-summary-card", className)} padding="md">
      <div className="ds-summary-card__header">
        <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
          <span className="ds-field-hint">{title}</span>
          <strong className="ds-summary-card__value">{value}</strong>
        </div>
        {icon ? <div aria-hidden="true">{icon}</div> : null}
      </div>
      {helperText ? <span className="ds-field-hint">{helperText}</span> : null}
      {badge ? <div>{badge}</div> : null}
    </Card>
  );
});
SummaryCard.displayName = "SummaryCard";

interface StateCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  artworkSlot?: ThemeEmptyStateSlot;
  artworkPriority?: boolean;
}

export const EmptyState = memo(function EmptyState({
  title,
  description,
  action,
  illustration,
  artworkSlot,
  artworkPriority = false,
  className,
}: StateCardProps) {
  return (
    <Card className={cx("ds-empty-state", className)} padding="lg">
      <div className="ds-empty-state__icon" aria-hidden="true">
        {illustration ?? (artworkSlot ? (
          <ThemeArtwork slot={artworkSlot} decorative priority={artworkPriority} />
        ) : (
          <Search size={22} />
        ))}
      </div>
      <div style={{ display: "grid", gap: "var(--ds-space-2)" }}>
        <strong>{title}</strong>
        {description ? <span className="ds-field-hint">{description}</span> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </Card>
  );
});
EmptyState.displayName = "EmptyState";

export const ErrorState = memo(function ErrorState({
  title,
  description,
  action,
  illustration,
  className,
}: StateCardProps) {
  return (
    <Card className={cx("ds-error-state", className)} padding="lg">
      <div className="ds-error-state__icon" aria-hidden="true">
        {illustration ?? <TriangleAlert size={22} />}
      </div>
      <div style={{ display: "grid", gap: "var(--ds-space-2)" }}>
        <strong>{title}</strong>
        {description ? <span className="ds-field-hint">{description}</span> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </Card>
  );
});
ErrorState.displayName = "ErrorState";

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  children?: ReactNode;
}

export const ConfirmationDialog = memo(function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="ds-confirmation-dialog">{children}</div>
    </Modal>
  );
});
ConfirmationDialog.displayName = "ConfirmationDialog";

export const PatternIcons = {
  Search,
  ChevronLeft,
  ChevronRight,
};
