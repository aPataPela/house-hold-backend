import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Badge, Button, Card, GlassSurface } from "../primitives";
import { ThemeRegistry, themeDefinitions, ThemeArtwork, ThemeBackground, ThemeIcon } from "../theme";
import { ThemeStory, themeIds } from "./story-helpers";

const meta = {
  title: "Design System/Theme Assets",
  component: ThemeArtwork,
  tags: ["autodocs"],
} satisfies Meta<Record<string, unknown>>;

export default meta;

type Story = StoryObj<Record<string, unknown>>;

const assetSlots = {
  backgrounds: ["appBackground", "authBackground", "onboardingBackground", "homeBackground"] as const,
  heroes: ["onboardingHero", "homeHero", "themePreview"] as const,
  emptyStates: ["expensesEmpty", "absencesEmpty", "tasksEmpty", "houseEmpty", "rulesEmpty"] as const,
  decorative: ["footerDecoration", "headerDecoration", "modalDecoration", "subtlePattern"] as const,
};

const brokenRegistry = new ThemeRegistry(
  themeIds.map((themeId) => {
    const definition = themeDefinitions[themeId];
    if (themeId !== "patagonia") {
      return { themeId, definition };
    }

    return {
      themeId,
      definition: {
        ...definition,
        assets: {
          ...definition.assets,
          hero: {
            ...definition.assets.hero,
            themePreview: {
              ...definition.assets.hero?.themePreview,
              src: "/assets/themes/patagonia/missing-preview.webp",
            },
          },
        },
      },
    };
  }),
);

function ThemeAssetsShowcase({
  themeId,
  reducedTransparency = false,
  narrow = false,
  zoom = 1,
  loading = false,
  longLabels = false,
  registry,
}: {
  themeId: (typeof themeIds)[number];
  reducedTransparency?: boolean;
  narrow?: boolean;
  zoom?: number;
  loading?: boolean;
  longLabels?: boolean;
  registry?: ThemeRegistry;
}) {
  const caption = longLabels
    ? "This is a deliberately long caption to verify wrapping, overflow resistance, and readable composition in narrow and zoomed viewports."
    : "Semantic slot preview.";

  return (
    <ThemeStory
      themeId={themeId}
      reducedTransparency={reducedTransparency}
      narrow={narrow}
      zoom={zoom}
      registry={registry}
    >
      <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
        <Card>
          <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--ds-space-3)", alignItems: "start" }}>
              <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
                <strong>{themeDefinitions[themeId].metadata.label}</strong>
                <span className="ds-field-hint">
                  {longLabels
                    ? "Long-copy mode to validate labels, captions, and helper text."
                    : "Slot catalog for the active theme."}
                </span>
              </div>
              <Badge tone={reducedTransparency ? "warning" : "neutral"}>
                {reducedTransparency ? "Reduced transparency" : "Default glass"}
              </Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-2)" }}>
              <Button trailingIcon={<ArrowRight size={16} />}>Continue</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
          </div>
        </Card>

        <section style={{ position: "relative", minHeight: narrow ? 220 : 280, borderRadius: "var(--ds-radius-4)", overflow: "hidden" }}>
          <ThemeBackground
            slot="appBackground"
            themeId={themeId}
            overlay={
              <div
                style={{
                  padding: "var(--ds-space-4)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "end",
                  gap: "var(--ds-space-3)",
                }}
              >
                <div style={{ display: "grid", gap: "var(--ds-space-1)", maxWidth: "24rem" }}>
                  <strong>Background slot</strong>
                  <span className="ds-field-hint">
                    {caption}
                  </span>
                </div>
                <Badge tone="success">
                  <Sparkles size={12} />
                  Decorative only
                </Badge>
              </div>
            }
          />
        </section>

        <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
          <section style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            <strong>Backgrounds</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--ds-space-3)" }}>
              {assetSlots.backgrounds.map((slot) => (
                <GlassSurface key={slot} padding="sm">
                  <div style={{ position: "relative", minHeight: 120, borderRadius: "var(--ds-radius-3)", overflow: "hidden" }}>
                    <ThemeBackground slot={slot} themeId={themeId} />
                    <div style={{ position: "relative", zIndex: 1, padding: "var(--ds-space-3)" }}>
                      <Badge tone="neutral">{slot}</Badge>
                    </div>
                  </div>
                </GlassSurface>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            <strong>Heroes</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--ds-space-3)" }}>
              {assetSlots.heroes.map((slot) => (
                <Card key={slot} elevated>
                  <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
                    <ThemeArtwork
                      slot={slot}
                      themeId={themeId}
                      loading={loading ? "lazy" : "eager"}
                      decorative={slot === "themePreview"}
                      alt={
                        slot === "themePreview"
                          ? "Vista previa del tema"
                          : longLabels
                            ? "Ilustración informativa utilizada para validar descripciones largas y comportamiento responsivo."
                            : "Ilustración informativa"
                      }
                      caption={slot === "themePreview" ? undefined : caption}
                      fallback={<div className="ds-field-hint">Fallback for {slot}</div>}
                    />
                    <Badge tone="neutral">{slot}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            <strong>Empty states</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--ds-space-3)" }}>
              {assetSlots.emptyStates.map((slot) => (
                <Card key={slot}>
                  <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
                    <ThemeArtwork
                      slot={slot}
                      themeId={themeId}
                      alt={longLabels ? `This is the ${slot} empty state illustration used for fallback and accessibility validation.` : `${slot} illustration`}
                      loading={loading ? "lazy" : "eager"}
                      fallback={<div className="ds-field-hint">No asset yet for {slot}</div>}
                    />
                    <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
                      <strong>{slot}</strong>
                      <span className="ds-field-hint">Informative illustration with text alternative.</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            <strong>Decorative</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--ds-space-3)" }}>
              {assetSlots.decorative.map((slot) => (
                <GlassSurface key={slot}>
                  <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
                    <ThemeArtwork slot={slot} themeId={themeId} decorative fallback={<div className="ds-field-hint">Decorative fallback</div>} />
                    <Badge tone="neutral">{slot}</Badge>
                  </div>
                </GlassSurface>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            <strong>Icon</strong>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-3)", flexWrap: "wrap" }}>
                <ThemeIcon slot="homeIcon" themeId={themeId} decorative={false} label="Home icon" size={40} />
                <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
                  <strong>homeIcon</strong>
                  <span className="ds-field-hint">Supports accessible and decorative usage.</span>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {loading ? (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-2)" }}>
              <LoaderCircle aria-hidden="true" size={16} />
              <span className="ds-field-hint">Simulated loading state for deferred asset composition.</span>
            </div>
          </Card>
        ) : null}
      </div>
    </ThemeStory>
  );
}

export const Mobile320: Story = {
  render: () => <ThemeAssetsShowcase themeId="patagonia" narrow />,
};

export const Mobile390: Story = {
  render: () => <ThemeAssetsShowcase themeId="chiloe" />,
};

export const Desktop: Story = {
  render: () => <ThemeAssetsShowcase themeId="cordillera" />,
};

export const Zoom200: Story = {
  render: () => <ThemeAssetsShowcase themeId="san-pedro" zoom={2} />,
};

export const ReducedTransparency: Story = {
  render: () => <ThemeAssetsShowcase themeId="patagonia" reducedTransparency />,
};

export const LongLabels: Story = {
  render: () => <ThemeAssetsShowcase themeId="chiloe" longLabels />,
};

export const Loading: Story = {
  render: () => <ThemeAssetsShowcase themeId="cordillera" loading />,
};

export const ErrorFallback: Story = {
  render: () => <ThemeAssetsShowcase themeId="patagonia" registry={brokenRegistry} />,
};
