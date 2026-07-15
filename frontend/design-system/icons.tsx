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
import type { ReactNode, SVGProps } from "react";
import { cx } from "./utils";
import type { ThemeId } from "./theme/theme-contract";

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

export interface ThemeHomeIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  themeId?: ThemeId;
  state?: ThemeHomeIconState;
  active?: boolean;
  decorative?: boolean;
  label?: string;
  size?: number;
}

type ThemeHomeVariantProps = {
  active: boolean;
};

const themeHomeVariantLabels: Record<ThemeId, string> = {
  patagonia: "Inicio Patagónico",
  chiloe: "Inicio chilote",
  cordillera: "Inicio cordillerano",
  "san-pedro": "Inicio sanpedrino",
};

function HomeBackplate({ active }: ThemeHomeVariantProps) {
  return <path d="M6.5 11.25 12 6.75l5.5 4.5V18a.75.75 0 0 1-.75.75h-10A.75.75 0 0 1 6 18v-6.75Z" fill="currentColor" fillOpacity={active ? 0.12 : 0} stroke="none" />;
}

function PatagoniaGlyph({ active }: ThemeHomeVariantProps) {
  return (
    <>
      <HomeBackplate active={active} />
      <path d="M6 11.25 12 6l6 5.25" />
      <path d="M7.25 10.5V18h9.5v-7.5" />
      <path d="M10 18v-4h4v4" />
      <path d="M4.75 13.75c1.15-.9 2.05-1.2 3.15-1" />
      <path d="M19.25 13.75c-1.15-.9-2.05-1.2-3.15-1" />
      <path d="M8 13.5c-.15-.9.25-1.65.95-2.2" />
      <path d="M16 13.5c.15-.9-.25-1.65-.95-2.2" />
      <path d="M8.2 15.25c.65-.45 1.25-.55 1.95-.35" />
      <path d="M15.8 15.25c-.65-.45-1.25-.55-1.95-.35" />
    </>
  );
}

function ChiloeGlyph({ active }: ThemeHomeVariantProps) {
  return (
    <>
      <HomeBackplate active={active} />
      <path d="M6 11.5 12 6.5l6 5" />
      <path d="M7 11.5v4.25h10V11.5" />
      <path d="M8 15.75v3.25" />
      <path d="M12 15.75v3.25" />
      <path d="M16 15.75v3.25" />
      <path d="M4.5 19.25c1.5-1 3-.85 4.5 0s3 .85 4.5 0 3-.85 4.5 0" />
      <path d="M9.25 12.75h5.5" />
      <path d="M10.5 10.5c.55-.55 1.45-.55 2 0" />
    </>
  );
}

function CordilleraGlyph({ active }: ThemeHomeVariantProps) {
  return (
    <>
      <HomeBackplate active={active} />
      <path d="M5.5 12.25 12 5.75l6.5 6.5" />
      <path d="M7.25 11.75V18h9.5v-6.25" />
      <path d="M9 12.5 12 9l2.25 2.6 2.5-3.35 1.75 2.2" />
      <path d="M8.25 18v-3.5h7.5V18" />
      <path d="M10.25 18v-2.5h3.5V18" />
      <path d="M5 11.75h14" />
      <path d="M14.5 8.5 16 7" />
      <path d="M7.5 8.5 9 7" />
    </>
  );
}

function SanPedroGlyph({ active }: ThemeHomeVariantProps) {
  return (
    <>
      <HomeBackplate active={active} />
      <path d="M6 11.5 12 7l6 4.5" />
      <path d="M7.25 11.5V18h9.5v-6.5" />
      <path d="M10.25 18v-3.25A1.75 1.75 0 0 1 12 13h0a1.75 1.75 0 0 1 1.75 1.75V18" />
      <path d="M8.5 15.25h7" />
      <path d="M5 18.25c1.25-.95 2.75-1.2 4.25-.65s3 .55 4.25 0 3-.3 4.5.65" />
      <path d="M14.5 8.5c1.15.1 2.1.7 2.75 1.65" />
      <path d="M7.25 10.25c.7-.85 1.75-1.35 2.85-1.4" />
    </>
  );
}

const themeHomeVariants: Record<ThemeId, (props: ThemeHomeVariantProps) => ReactNode> = {
  patagonia: PatagoniaGlyph,
  chiloe: ChiloeGlyph,
  cordillera: CordilleraGlyph,
  "san-pedro": SanPedroGlyph,
};

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
  const Glyph = themeHomeVariants[themeId];
  return (
    <svg
      {...props}
      className={cx("ds-theme-home-icon", className)}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label ?? themeHomeVariantLabels[themeId]}
      data-theme-home-icon={themeId}
      data-state={isActive ? "active" : "inactive"}
    >
      {Glyph({ active: isActive })}
    </svg>
  );
}

export const themeHomeIconLabels = themeHomeVariantLabels;

export const Iconography = {
  functionalIconMap,
  functionalIconLabels,
  functionalIconCatalog,
  ThemeHomeIcon,
};
