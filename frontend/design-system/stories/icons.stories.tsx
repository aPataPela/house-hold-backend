import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, BottomNavigation, Card, FunctionalIcon, ThemeHomeIcon } from "..";
import { ThemeStory, themeIds } from "./story-helpers";

const meta = {
  title: "Design System/Iconography",
  tags: ["autodocs"],
} satisfies Meta<Record<string, unknown>>;

export default meta;

type Story = StoryObj<Record<string, unknown>>;

const functionalNames = [
  "gastos",
  "calendario",
  "ausencia",
  "tareas",
  "reglas",
  "integrantes",
  "casa",
  "editar",
  "eliminar",
  "filtro",
  "buscar",
  "agregar",
  "volver",
  "cerrar",
  "confirmar",
  "advertencia",
  "éxito",
  "información",
  "menú",
  "más",
] as const;

function IconCatalog() {
  return (
    <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
      <Card>
        <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
          <strong>Functional catalog</strong>
          <span className="ds-field-hint">
            Single open source family, stable stroke, stable viewBox, theme-independent.
          </span>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--ds-space-3)" }}>
        {functionalNames.map((name) => (
          <Card key={name}>
            <div style={{ display: "grid", justifyItems: "center", gap: "var(--ds-space-2)", textAlign: "center" }}>
              <FunctionalIcon name={name} size={24} decorative={false} label={name} />
              <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
                <strong>{name}</strong>
                <span className="ds-field-hint">24px</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HomeVariants() {
  return (
    <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
      <Card>
        <div style={{ display: "grid", gap: "var(--ds-space-2)" }}>
          <strong>Home thematic variants</strong>
          <span className="ds-field-hint">Monochrome, same stroke, same size, active and inactive states.</span>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--ds-space-3)" }}>
        {themeIds.map((themeId) => (
          <Card key={themeId}>
            <div style={{ display: "grid", gap: "var(--ds-space-3)", justifyItems: "center", textAlign: "center" }}>
              <ThemeHomeIcon themeId={themeId} state="active" size={28} decorative={false} label={`Inicio ${themeId}`} />
              <ThemeHomeIcon themeId={themeId} state="inactive" size={20} decorative={false} label={`Inicio ${themeId}`} />
              <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
                <strong>{themeId}</strong>
                <span className="ds-field-hint">28px active / 20px inactive</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BottomNavShowcase() {
  return (
    <Card elevated>
      <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--ds-space-3)", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
            <strong>Bottom navigation</strong>
            <span className="ds-field-hint">Icon state mirrors the active section.</span>
          </div>
          <Badge tone="neutral">Contrast check</Badge>
        </div>
        <BottomNavigation
          value="home"
          items={[
            {
              value: "home",
              label: "Inicio",
              icon: (active: boolean) => <ThemeHomeIcon themeId="patagonia" state={active ? "active" : "inactive"} size={20} />,
            },
            { value: "expenses", label: "Gastos", icon: <FunctionalIcon name="gastos" size={20} /> },
            { value: "rules", label: "Reglas", icon: <FunctionalIcon name="reglas" size={20} /> },
            { value: "absences", label: "Ausencias", icon: <FunctionalIcon name="ausencia" size={20} /> },
            { value: "house", label: "Casa", icon: <FunctionalIcon name="casa" size={20} /> },
          ]}
        />
      </div>
    </Card>
  );
}

function IconShowcase({
  themeId = "patagonia",
  reducedTransparency = false,
  narrow = false,
  zoom = 1,
}: {
  themeId: (typeof themeIds)[number];
  reducedTransparency?: boolean;
  narrow?: boolean;
  zoom?: number;
}) {
  return (
    <ThemeStory themeId={themeId} reducedTransparency={reducedTransparency} narrow={narrow} zoom={zoom}>
      <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
        <IconCatalog />
        <HomeVariants />
        <BottomNavShowcase />
      </div>
    </ThemeStory>
  );
}

export const Mobile320: Story = {
  render: () => <IconShowcase themeId="patagonia" narrow />,
};

export const Mobile390: Story = {
  render: () => <IconShowcase themeId="chiloe" />,
};

export const Desktop: Story = {
  render: () => <IconShowcase themeId="cordillera" />,
};

export const Zoom200: Story = {
  render: () => <IconShowcase themeId="san-pedro" zoom={2} />,
};

export const ReducedTransparency: Story = {
  render: () => <IconShowcase themeId="patagonia" reducedTransparency />,
};
