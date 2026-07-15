# Iconography System

## Library

- Shared functional icons use `lucide-react`.
- The Home icon is custom and theme-aware.
- All shared icons keep the same stroke weight and 24x24 viewBox.

## Functional mapping

- `gastos` -> `ReceiptText`
- `calendario` -> `CalendarDays`
- `ausencia` -> `CalendarOff`
- `tareas` -> `ListTodo`
- `reglas` -> `Scale`
- `integrantes` -> `UserRound`
- `casa` -> `Home`
- `editar` -> `PencilLine`
- `eliminar` -> `Trash2`
- `filtro` -> `Filter`
- `buscar` -> `Search`
- `agregar` -> `Plus`
- `volver` -> `ArrowLeft`
- `cerrar` -> `X`
- `confirmar` -> `Check`
- `advertencia` -> `TriangleAlert`
- `éxito` -> `CircleCheck`
- `información` -> `Info`
- `menú` -> `Menu`
- `más` -> `MoreHorizontal`

## Rules

- Functional icons never change by theme.
- Interactive icons must receive a label.
- Decorative icons should stay `aria-hidden`.
- Use 20px in dense navigation, 24px in regular UI, 28px for emphasis.
- Keep stroke weight at `1.75`.
- Use `ThemeHomeIcon` only for the Home slot.
- Home icon variants are monochrome and support active/inactive states.

## Usage

```tsx
import { FunctionalIcon, ThemeHomeIcon } from "@/design-system";

<FunctionalIcon name="buscar" decorative={false} label="Buscar" />
<ThemeHomeIcon themeId="patagonia" state="active" />
```

