"use client";

import type { LucideIcon, LucideProps } from "lucide-react";
import {
  ArrowLeft,
  CalendarDays,
  CalendarOff,
  Check,
  CircleCheck,
  Filter,
  Home,
  Info,
  ListTodo,
  Menu,
  MoreHorizontal,
  PencilLine,
  Plus,
  ReceiptText,
  Search,
  Scale,
  Trash2,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import { cx } from "./utils";
import type { ThemeId } from "./theme/theme-contract";
import { ThemeIcon } from "./theme/theme-visuals";

export type FunctionalIconName =
  | "gastos"
  | "calendario"
  | "ausencia"
  | "tareas"
  | "reglas"
  | "integrantes"
  | "casa"
  | "editar"
  | "eliminar"
  | "filtro"
  | "buscar"
  | "agregar"
  | "volver"
  | "cerrar"
  | "confirmar"
  | "advertencia"
  | "éxito"
  | "información"
  | "menú"
  | "más";

export interface FunctionalIconProps extends Omit<LucideProps, "ref"> {
  name: FunctionalIconName;
  decorative?: boolean;
  label?: string;
}

export const functionalIconLabels: Record<FunctionalIconName, string> = {
  gastos: "Gastos",
  calendario: "Calendario",
  ausencia: "Ausencia",
  tareas: "Tareas",
  reglas: "Reglas",
  integrantes: "Integrantes",
  casa: "Casa",
  editar: "Editar",
  eliminar: "Eliminar",
  filtro: "Filtrar",
  buscar: "Buscar",
  agregar: "Agregar",
  volver: "Volver",
  cerrar: "Cerrar",
  confirmar: "Confirmar",
  advertencia: "Advertencia",
  éxito: "Éxito",
  información: "Información",
  menú: "Menú",
  más: "Más",
};

const functionalIconMap: Record<FunctionalIconName, LucideIcon> = {
  gastos: ReceiptText,
  calendario: CalendarDays,
  ausencia: CalendarOff,
  tareas: ListTodo,
  reglas: Scale,
  integrantes: UserRound,
  casa: Home,
  editar: PencilLine,
  eliminar: Trash2,
  filtro: Filter,
  buscar: Search,
  agregar: Plus,
  volver: ArrowLeft,
  cerrar: X,
  confirmar: Check,
  advertencia: TriangleAlert,
  éxito: CircleCheck,
  información: Info,
  menú: Menu,
  más: MoreHorizontal,
};

export const functionalIconCatalog = Object.entries(functionalIconMap).map(([name, icon]) => ({
  name: name as FunctionalIconName,
  label: functionalIconLabels[name as FunctionalIconName],
  icon,
}));

export function FunctionalIcon({
  name,
  decorative = true,
  label,
  className,
  size = 24,
  strokeWidth = 1.75,
  absoluteStrokeWidth = true,
  ...props
}: FunctionalIconProps) {
  const Icon = functionalIconMap[name];
  return (
    <Icon
      {...props}
      className={cx("ds-functional-icon", className)}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label ?? functionalIconLabels[name]}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
    />
  );
}

export type ThemeHomeIconState = "active" | "inactive";

export interface ThemeHomeIconProps extends HTMLAttributes<HTMLSpanElement> {
  themeId?: ThemeId;
  state?: ThemeHomeIconState;
  active?: boolean;
  decorative?: boolean;
  label?: string;
  size?: number;
}

export function ThemeHomeIcon({
  themeId = "patagonia",
  state,
  active,
  decorative = true,
  label,
  size = 24,
  className,
  ...props
}: ThemeHomeIconProps) {
  const isActive = state ? state === "active" : active ?? true;
  return (
    <ThemeIcon
      {...props}
      className={cx("ds-theme-home-icon", className)}
      slot="homeIcon"
      themeId={themeId}
      state={isActive ? "active" : "inactive"}
      decorative={decorative}
      label={label ?? "Inicio"}
      size={size}
      data-theme-home-icon={themeId}
    />
  );
}

export const Iconography = {
  functionalIconMap,
  functionalIconLabels,
  functionalIconCatalog,
  ThemeHomeIcon,
};
