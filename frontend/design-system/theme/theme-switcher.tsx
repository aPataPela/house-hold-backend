"use client";

import { Palette, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Modal } from "../primitives";
import { ThemeArtwork } from "./theme-visuals";
import { defaultAssetRegistry } from "./theme-asset-registry";
import { defaultThemeRegistry } from "./theme-registry";
import { useTheme } from "./theme-provider";
import type { ThemeId } from "./theme-contract";

export function ThemeSwitcher() {
  const { houseThemeId, personalThemeId, activeThemeId, theme, setPersonalTheme, setReducedTransparency, reducedTransparency } =
    useTheme();
  const [open, setOpen] = useState(false);

  const themes = useMemo(() => defaultThemeRegistry.list(), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    void defaultAssetRegistry.preloadThemes(
      themes.map((entry) => entry.themeId),
      "thumbnail",
    );
  }, [open, themes]);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        leadingIcon={<Palette size={16} />}
        onClick={() => setOpen(true)}
      >
        {theme.metadata.label}
      </Button>

      <Modal
        open={open}
        title="Tema visual"
        description="Elige un tema personal o vuelve al tema de la casa sin recargar la página."
        onClose={() => setOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--ds-space-2)" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPersonalTheme(null);
                setOpen(false);
              }}
            >
              Usar tema de la casa
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReducedTransparency(!reducedTransparency);
              }}
            >
              {reducedTransparency ? "Desactivar" : "Activar"} transparencia reducida
            </Button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
          <div style={{ display: "grid", gap: "var(--ds-space-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--ds-space-2)", alignItems: "center" }}>
              <strong>Tema actual</strong>
              <Badge tone="neutral">{personalThemeId ? "Preferencia personal" : "Tema de la casa"}</Badge>
            </div>
            <div className="ds-field-hint">
              Casa: {labelFromThemeId(houseThemeId)} · Activo: {labelFromThemeId(activeThemeId)}
            </div>
          </div>

          <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
            {themes.map((entry) => {
              const selected = entry.themeId === activeThemeId;
              return (
                <button
                  key={entry.themeId}
                  type="button"
                  className="ds-theme-preview-card"
                  data-selected={selected ? "true" : undefined}
                  onClick={() => {
                    setPersonalTheme(entry.themeId);
                  }}
                >
                  <span
                    className="ds-theme-preview-card__swatch"
                    data-theme-id={entry.themeId}
                    aria-hidden="true"
                  >
                    <ThemeArtwork
                      slot="themePreview"
                      themeId={entry.themeId}
                      decorative
                      className="ds-theme-preview-card__thumb"
                      imgProps={{ className: "ds-theme-preview-card__thumb-image" }}
                    />
                  </span>
                  <span style={{ display: "grid", gap: "var(--ds-space-1)", textAlign: "left" }}>
                    <strong>{entry.definition.metadata.label}</strong>
                    <span className="ds-field-hint">
                      {entry.definition.metadata.supportsReducedTransparency
                        ? "Soporta transparencia reducida"
                        : "Sin transparencia reducida"}
                    </span>
                  </span>
                  <Badge tone={selected ? "success" : "neutral"}>{selected ? "Activo" : "Elegir"}</Badge>
                </button>
              );
            })}
          </div>

          <div className="ds-field-hint" style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-2)" }}>
            <Sparkles size={14} />
            El cambio se aplica inmediatamente y queda guardado localmente para futuras sesiones.
          </div>
        </div>
      </Modal>
    </>
  );
}

function labelFromThemeId(themeId: ThemeId): string {
  return defaultThemeRegistry.get(themeId).metadata.label;
}
