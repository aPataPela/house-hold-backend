"use client";
/* eslint-disable @next/next/no-img-element */

import {
  forwardRef,
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type DialogHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Menu,
  X,
} from "lucide-react";
import { cx, getInitials, useEscapeKey, useFocusTrap } from "./utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  success?: boolean;
  hover?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      variant = "primary",
      loading = false,
      success = false,
      hover = false,
      leadingIcon,
      trailingIcon,
      disabled,
      children,
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        data-variant={variant}
        data-loading={loading ? "true" : undefined}
        data-success={success ? "true" : undefined}
        data-hover={hover ? "true" : undefined}
        className={cx("ds-button", className)}
        {...props}
      >
        {loading ? <span className="ds-button__spinner" aria-hidden="true" /> : leadingIcon}
        <span>{children}</span>
        {!loading && trailingIcon}
      </button>
    );
  }),
);
Button.displayName = "Button";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: Exclude<Variant, "primary"> | "ghost";
  loading?: boolean;
  success?: boolean;
  hover?: boolean;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    {
      icon,
      label,
      variant = "secondary",
      loading = false,
      success = false,
      hover = false,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        disabled={disabled || loading}
        data-variant={variant}
        data-loading={loading ? "true" : undefined}
        data-success={success ? "true" : undefined}
        data-hover={hover ? "true" : undefined}
        className={cx("ds-icon-button", className)}
        {...props}
      >
        {loading ? <LoaderCircle aria-hidden="true" size={18} /> : icon}
      </button>
    );
  }),
);
IconButton.displayName = "IconButton";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  elevated?: boolean;
}

export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(function Card(
    { padding = "md", elevated = false, className, style, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cx("ds-card", className)}
        data-elevated={elevated ? "true" : undefined}
        style={{
          padding:
            padding === "none"
              ? "0"
              : padding === "sm"
                ? "var(--ds-space-3)"
                : padding === "lg"
                  ? "var(--ds-space-6)"
                  : "var(--ds-space-4)",
          ...style,
        }}
        {...props}
      />
    );
  }),
);
Card.displayName = "Card";

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export const GlassSurface = memo(
  forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
    { padding = "md", className, style, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cx("ds-card ds-glass-surface", className)}
        style={{
          padding:
            padding === "none"
              ? "0"
              : padding === "sm"
                ? "var(--ds-space-3)"
                : padding === "lg"
                  ? "var(--ds-space-6)"
                  : "var(--ds-space-4)",
          ...style,
        }}
        {...props}
      />
    );
  }),
);
GlassSurface.displayName = "GlassSurface";

interface FieldState {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  loading?: boolean;
  required?: boolean;
}

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement>, FieldState {
  id?: string;
  children: ReactNode;
}

export const FormField = memo(
  forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
    { id, label, hint, error, success, loading, required, children, className, ...props },
    ref,
  ) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div ref={ref} className={cx("ds-form-field", className)} {...props}>
        {label ? (
          <label className="ds-form-field__label" htmlFor={fieldId}>
            <span>{label}</span>
            {required ? <span aria-hidden="true">*</span> : null}
            {loading ? <LoaderCircle aria-hidden="true" size={14} /> : null}
          </label>
        ) : null}
        <div className="ds-form-field__control">
          {typeof children === "function"
            ? (children as (fieldId: string) => ReactNode)(fieldId)
            : children}
          {error ? <div className="ds-field-error">{error}</div> : null}
          {!error && success ? <div className="ds-field-hint">{success}</div> : null}
          {!error && !success && hint ? <div className="ds-field-hint">{hint}</div> : null}
        </div>
      </div>
    );
  }),
);
FormField.displayName = "FormField";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldState {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const TextField = memo(
  forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
    {
      id,
      label,
      hint,
      error,
      success,
      loading,
      leadingIcon,
      trailingIcon,
      className,
      disabled,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FormField id={fieldId} label={label} hint={hint} error={error} success={success} loading={loading}>
        <div style={{ display: "grid", gap: "var(--ds-space-2)" }}>
          {leadingIcon || trailingIcon ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: leadingIcon ? "auto 1fr" : "1fr auto",
                gap: "var(--ds-space-2)",
                alignItems: "center",
              }}
            >
              {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
              <input
                ref={ref}
                id={fieldId}
                disabled={disabled}
                data-error={error ? "true" : undefined}
                data-success={success ? "true" : undefined}
                className={cx("ds-input", className)}
                {...props}
              />
              {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
            </div>
          ) : (
            <input
              ref={ref}
              id={fieldId}
              disabled={disabled}
              data-error={error ? "true" : undefined}
              data-success={success ? "true" : undefined}
              className={cx("ds-input", className)}
              {...props}
            />
          )}
        </div>
      </FormField>
    );
  }),
);
TextField.displayName = "TextField";

type SelectOption = { value: string; label: string; disabled?: boolean };

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldState {
  options: SelectOption[];
}

export const Select = memo(
  forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { id, label, hint, error, success, loading, options, className, disabled, children, ...props },
    ref,
  ) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FormField id={fieldId} label={label} hint={hint} error={error} success={success} loading={loading}>
        <div style={{ position: "relative" }}>
          <select
            ref={ref}
            id={fieldId}
            disabled={disabled}
            data-error={error ? "true" : undefined}
            data-success={success ? "true" : undefined}
            className={cx("ds-select", className)}
            {...props}
          >
            {children}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            size={18}
            style={{
              position: "absolute",
              right: "var(--ds-space-3)",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ds-text-secondary)",
              pointerEvents: "none",
            }}
          />
        </div>
      </FormField>
    );
  }),
);
Select.displayName = "Select";

export interface DateFieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldState {}

export const DateField = memo(
  forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
    { id, label, hint, error, success, loading, className, disabled, ...props },
    ref,
  ) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FormField id={fieldId} label={label} hint={hint} error={error} success={success} loading={loading}>
        <input
          ref={ref}
          id={fieldId}
          type="date"
          disabled={disabled}
          data-error={error ? "true" : undefined}
          data-success={success ? "true" : undefined}
          className={cx("ds-date-field", className)}
          {...props}
        />
      </FormField>
    );
  }),
);
DateField.displayName = "DateField";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabItem[];
  children?: ReactNode;
}

export const Tabs = memo(
  forwardRef<HTMLDivElement, TabsProps>(function Tabs(
    { value, onValueChange, tabs, children, className, ...props },
    ref,
  ) {
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

    function moveFocus(direction: -1 | 1) {
      const enabledTabs = tabs.filter((tab) => !tab.disabled);
      if (!enabledTabs.length) return;
      const currentIndex = enabledTabs.findIndex((tab) => tab.value === value);
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + direction + enabledTabs.length) % enabledTabs.length;
      onValueChange(enabledTabs[nextIndex].value);
      tabRefs.current[nextIndex]?.focus();
    }

    return (
      <div ref={ref} className={cx("ds-tabs", className)} {...props}>
        <div role="tablist" aria-label="Tabs" className="ds-tabs__list">
          {tabs.map((tab, index) => {
            const active = tab.value === value;
            return (
              <button
                key={tab.value}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled={tab.disabled || undefined}
                disabled={tab.disabled}
                data-active={active ? "true" : undefined}
                className="ds-tab"
                onClick={() => onValueChange(tab.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveFocus(-1);
                  }
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    moveFocus(1);
                  }
                }}
              >
                <span>{tab.label}</span>
                <span aria-hidden="true" className="ds-tab__indicator" />
              </button>
            );
          })}
        </div>
        {children}
      </div>
    );
  }),
);
Tabs.displayName = "Tabs";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger";
}

export const Badge = memo(
  forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { tone = "neutral", className, children, ...props },
    ref,
  ) {
    return (
      <span ref={ref} data-tone={tone} className={cx("ds-badge", className)} {...props}>
        {children}
      </span>
    );
  }),
);
Badge.displayName = "Badge";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: number;
}

export const Avatar = memo(
  forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
    { name, src, size = 44, className, style, ...props },
    ref,
  ) {
    const initials = useMemo(() => getInitials(name), [name]);
    return (
      <div
        ref={ref}
        aria-label={name}
        className={cx("ds-avatar", className)}
        style={{ width: size, height: size, ...style }}
        {...props}
      >
        {src ? <img src={src} alt="" /> : initials}
      </div>
    );
  }),
);
Avatar.displayName = "Avatar";

interface ModalBaseProps extends DialogHTMLAttributes<HTMLDivElement> {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
}

export const Modal = memo(function Modal({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  closeLabel = "Cerrar",
}: ModalBaseProps) {
  const panelRef = useFocusTrap(open);
  useEscapeKey(open, onClose);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        className="ds-modal__backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div ref={panelRef as never} className="ds-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ds-modal-title" aria-describedby={description ? "ds-modal-description" : undefined}>
        <div className="ds-modal__header">
          <div>
            <div id="ds-modal-title" className="ds-modal__title">
              {title}
            </div>
            {description ? (
              <div id="ds-modal-description" className="ds-field-hint">
                {description}
              </div>
            ) : null}
          </div>
          <IconButton icon={<X size={18} />} label={closeLabel} onClick={onClose} />
        </div>
        <div className="ds-modal__body">{children}</div>
        {footer ? <div className="ds-modal__footer">{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
});
Modal.displayName = "Modal";

interface DrawerProps extends DialogHTMLAttributes<HTMLDivElement> {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  placement?: "bottom" | "right";
}

export const Drawer = memo(function Drawer({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  closeLabel = "Cerrar",
  placement = "bottom",
}: DrawerProps) {
  const panelRef = useFocusTrap(open);
  useEscapeKey(open, onClose);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        className="ds-drawer__backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        ref={panelRef as never}
        className="ds-drawer__panel"
        data-placement={placement}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ds-drawer-title"
        aria-describedby={description ? "ds-drawer-description" : undefined}
      >
        <div className="ds-drawer__header">
          <div>
            <div id="ds-drawer-title" className="ds-drawer__title">
              {title}
            </div>
            {description ? (
              <div id="ds-drawer-description" className="ds-field-hint">
                {description}
              </div>
            ) : null}
          </div>
          <IconButton icon={<X size={18} />} label={closeLabel} onClick={onClose} />
        </div>
        <div className="ds-drawer__body">{children}</div>
        {footer ? <div className="ds-drawer__footer">{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
});
Drawer.displayName = "Drawer";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "danger";
  title: string;
  description?: string;
  action?: ReactNode;
}

export const Toast = memo(
  forwardRef<HTMLDivElement, ToastProps>(function Toast(
    { tone = "info", title, description, action, className, ...props },
    ref,
  ) {
  const icon =
      tone === "success" ? (
        <CircleCheck size={18} />
      ) : tone === "warning" ? (
        <AlertTriangle size={18} />
      ) : tone === "danger" ? (
        <CircleX size={18} />
      ) : (
        <CircleAlert size={18} />
      );

    const toneColor =
      tone === "success"
        ? "var(--ds-success)"
        : tone === "warning"
          ? "var(--ds-warning)"
          : tone === "danger"
            ? "var(--ds-danger)"
            : "var(--ds-action-primary)";

    return (
      <div
        ref={ref}
        role="status"
        aria-live={tone === "danger" ? "assertive" : "polite"}
        data-tone={tone}
        className={cx("ds-toast", className)}
        {...props}
      >
        <div aria-hidden="true" style={{ color: toneColor, marginTop: "0.1rem" }}>
          {icon}
        </div>
        <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
          <strong>{title}</strong>
          {description ? <div className="ds-field-hint">{description}</div> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    );
  }),
);
Toast.displayName = "Toast";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export const Skeleton = memo(
  forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
    { width = "100%", height = 16, radius = "var(--ds-radius-2)", className, style, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        aria-busy="true"
        aria-hidden="true"
        className={cx("ds-skeleton", className)}
        style={{ width, height, borderRadius: radius, ...style }}
        {...props}
      />
    );
  }),
);
Skeleton.displayName = "Skeleton";

export interface BottomNavigationItem {
  value: string;
  label: string;
  icon: ReactNode;
  href?: string;
  disabled?: boolean;
}

export interface BottomNavigationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  value: string;
  items: BottomNavigationItem[];
  onChange?: (value: string) => void;
}

export const BottomNavigation = memo(
  forwardRef<HTMLElement, BottomNavigationProps>(function BottomNavigation(
    { value, items, onChange, className, ...props },
    ref,
  ) {
    return (
      <nav ref={ref} className={cx("ds-bottom-navigation", className)} {...props}>
        <div className="ds-bottom-navigation__items">
          {items.map((item) => {
            const active = item.value === value;
            const common = {
              "data-active": active ? "true" : undefined,
              className: "ds-bottom-navigation__item",
              children: (
                <>
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="ds-bottom-navigation__item-indicator" aria-hidden="true" />
                </>
              ),
            } as const;

            if (item.href) {
              return (
                <a
                  key={item.value}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={item.disabled || undefined}
                  {...common}
                />
              );
            }

            return (
              <button
                key={item.value}
                type="button"
                disabled={item.disabled}
                onClick={() => onChange?.(item.value)}
                {...common}
              />
            );
          })}
        </div>
      </nav>
    );
  }),
);
BottomNavigation.displayName = "BottomNavigation";

export const PrimitiveIcons = {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  LoaderCircle,
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  CircleX,
};
