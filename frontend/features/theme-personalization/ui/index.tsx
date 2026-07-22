"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  GlassSurface,
  ThemeArtwork,
  ThemeBackground,
  ThemeHomeIcon,
} from "@/design-system";
import {
  defaultAssetRegistry,
  defaultThemeRegistry,
  useTheme,
} from "@/design-system/theme";
import type { ThemeId } from "@/design-system/theme";
import { cx } from "@/design-system/utils";

type ThemeSelection = ThemeId | "house";
type ThemeLoadState = "loading" | "ready" | "error";

const themeDescriptions: Record<ThemeId, string> = {
  patagonia: "Botánico, sereno y húmedo.",
  chiloe: "Más cromático, costero y vivaz.",
  cordillera: "Mineral, alto y contenido.",
  "san-pedro": "Luminoso, floral y desértico.",
};

export function ThemeIdentityVisualPage() {
  const router = useRouter();
  const {
    houseThemeId,
    personalThemeId,
    setPersonalTheme,
    reducedTransparency,
  } = useTheme();
  const [draft, setDraft] = useState<ThemeSelection>(
    personalThemeId ?? "house",
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [thumbnailStatus, setThumbnailStatus] = useState<
    Record<ThemeId, ThemeLoadState>
  >({
    patagonia: "loading",
    chiloe: "loading",
    cordillera: "loading",
    "san-pedro": "loading",
  });

  const themes = useMemo(() => defaultThemeRegistry.list(), []);
  const previewThemeId = draft === "house" ? houseThemeId : draft;
  const activeSelectionId = personalThemeId ?? "house";
  const hasChanges = draft !== activeSelectionId;
  const previewTheme = defaultThemeRegistry.get(previewThemeId);

  useEffect(() => {
    const updateOffline = () => setOffline(!window.navigator.onLine);
    updateOffline();
    window.addEventListener("online", updateOffline);
    window.addEventListener("offline", updateOffline);
    return () => {
      window.removeEventListener("online", updateOffline);
      window.removeEventListener("offline", updateOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    for (const entry of themes) {
      void defaultAssetRegistry
        .preload(entry.themeId, "thumbnail")
        .then(() => {
          if (!cancelled) {
            setThumbnailStatus((current) => ({
              ...current,
              [entry.themeId]: "ready",
            }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setThumbnailStatus((current) => ({
              ...current,
              [entry.themeId]: "error",
            }));
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [themes]);

  const selectedThemeLabel = previewTheme.metadata.label;

  const applySelection = async () => {
    setSubmitted(false);
    setSaveError(false);
    setSaving(true);
    const targetThemeId = draft === "house" ? houseThemeId : draft;
    try {
      await defaultAssetRegistry.preload(targetThemeId, "essential");
      setPersonalTheme(draft === "house" ? null : draft);
      setSaving(false);
      setSubmitted(true);
      window.setTimeout(() => {
        setSubmitted(false);
      }, 1800);
    } catch {
      setSaving(false);
      setSaveError(true);
    }
  };

  const restoreDefault = () => {
    setDraft("house");
    setSubmitted(false);
  };

  const cancel = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/?section=house");
  };

  return (
    <section className="theme-identity-page">
      <header className="theme-identity-page__hero ds-glass-surface">
        <div className="theme-identity-page__breadcrumb">
          <span>Casa</span>
          <span aria-hidden="true">/</span>
          <span>Personalización</span>
          <span aria-hidden="true">/</span>
          <strong>Identidad visual</strong>
        </div>
        <div className="theme-identity-page__hero-copy">
          <p className="eyebrow">Identidad visual</p>
          <h1>Elige un tema personal sin cambiar tus datos ni flujos.</h1>
          <p className="ds-field-hint">
            La casa mantiene su tema por defecto. Tu preferencia personal solo
            se aplica cuando confirmas.
          </p>
        </div>
        <div className="theme-identity-page__hero-status">
          <Badge tone={personalThemeId ? "success" : "neutral"}>
            {personalThemeId
              ? "Preferencia personal"
              : "Usa el tema de la casa"}
          </Badge>
          <Badge tone={reducedTransparency ? "warning" : "neutral"}>
            {reducedTransparency ? "Transparencia reducida" : "Glass activo"}
          </Badge>
          {offline ? <Badge tone="warning">Offline</Badge> : null}
        </div>
      </header>

      <div className="theme-identity-page__layout">
        <Card elevated className="theme-identity-page__panel">
          <fieldset className="theme-choice-group">
            <legend className="theme-choice-group__legend">
              Preferencia de tema
            </legend>
            <label
              className={cx(
                "theme-choice-card",
                draft === "house" && "is-selected",
              )}
            >
              <input
                type="radio"
                name="theme-selection"
                value="house"
                checked={draft === "house"}
                onChange={() => setDraft("house")}
              />
              <span className="theme-choice-card__content">
                <ThemeHomeIcon
                  themeId={houseThemeId}
                  state={draft === "house" ? "active" : "inactive"}
                  size={24}
                />
                <span>
                  <strong>Usar tema de la casa</strong>
                  <span className="ds-field-hint">
                    Respeta la identidad común del hogar.
                  </span>
                </span>
              </span>
              <Badge tone={draft === "house" ? "success" : "neutral"}>
                {draft === "house" ? "Seleccionado" : "Disponible"}
              </Badge>
            </label>

            {themes.map((entry) => {
              const isSelected = draft === entry.themeId;
              const loadState = thumbnailStatus[entry.themeId];
              return (
                <label
                  key={entry.themeId}
                  className={cx(
                    "theme-choice-card",
                    isSelected && "is-selected",
                  )}
                >
                  <input
                    type="radio"
                    name="theme-selection"
                    value={entry.themeId}
                    checked={isSelected}
                    onChange={() => {
                      setDraft(entry.themeId);
                      setSubmitted(false);
                    }}
                  />
                  <span className="theme-choice-card__content">
                    <span className="theme-choice-card__thumb">
                      <ThemeArtwork
                        slot="themePreview"
                        themeId={entry.themeId}
                        alt={`Vista previa del tema ${entry.definition.metadata.label}`}
                        decorative={false}
                        fallback={
                          <span className="theme-choice-card__fallback">
                            {entry.definition.metadata.label}
                          </span>
                        }
                      />
                    </span>
                    <span>
                      <strong>{entry.definition.metadata.label}</strong>
                      <span className="ds-field-hint">
                        {themeDescriptions[entry.themeId]}
                      </span>
                    </span>
                  </span>
                  <div className="theme-choice-card__meta">
                    <Badge tone={isSelected ? "success" : "neutral"}>
                      {isSelected ? "Seleccionado" : "Elegir"}
                    </Badge>
                    <span className="ds-field-hint">
                      {loadState === "loading"
                        ? "Precargando..."
                        : loadState === "error"
                          ? "Fallback"
                          : "Listo"}
                    </span>
                  </div>
                </label>
              );
            })}
          </fieldset>

          <div className="theme-identity-page__actions">
            <Button
              variant="ghost"
              type="button"
              onClick={cancel}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={restoreDefault}
              disabled={saving || draft === "house"}
            >
              Restaurar predeterminado
            </Button>
            <Button
              type="button"
              onClick={applySelection}
              disabled={!hasChanges || saving}
            >
              {saving ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        </Card>

        <GlassSurface className="theme-identity-page__preview" padding="lg">
          <div className="theme-identity-page__preview-shell">
            <div className="theme-identity-page__preview-top">
              <div>
                <p className="eyebrow">Preview expandido</p>
                <h2>{selectedThemeLabel}</h2>
                <p className="ds-field-hint">
                  {draft === activeSelectionId
                    ? "Tema activo"
                    : "Preview inmediato sin guardar."}
                </p>
              </div>
              <div className="theme-identity-page__status-stack">
                <Badge tone={hasChanges ? "warning" : "success"}>
                  {hasChanges ? "Previewing" : "Selected"}
                </Badge>
                <ThemePreviewStatus
                  key={previewThemeId}
                  themeId={previewThemeId}
                />
                {submitted ? <Badge tone="success">Saved</Badge> : null}
                {saveError ? (
                  <Badge tone="danger">No se pudo aplicar</Badge>
                ) : null}
              </div>
            </div>

            <div className="theme-identity-page__hero-preview">
              <ThemeBackground slot="appBackground" themeId={previewThemeId} />
              <div className="theme-identity-page__hero-overlay">
                <ThemeArtwork
                  slot="themePreview"
                  themeId={previewThemeId}
                  decorative={false}
                  alt={`Preview del tema ${selectedThemeLabel}`}
                  fallback={
                    <Card>
                      <div
                        style={{ display: "grid", gap: "var(--ds-space-2)" }}
                      >
                        <strong>Fallback activo</strong>
                        <span className="ds-field-hint">
                          No se pudo cargar el preview. Se mantiene una
                          alternativa segura.
                        </span>
                      </div>
                    </Card>
                  }
                />
              </div>
            </div>

            <div className="theme-identity-page__preview-note">
              <p>
                Prioridad resuelta: preferencia personal → tema de la casa →
                tema por defecto.
              </p>
              <p>El cambio no recarga la app y se guarda solo al confirmar.</p>
            </div>
          </div>
        </GlassSurface>
      </div>
    </section>
  );
}

function ThemePreviewStatus({ themeId }: { themeId: ThemeId }) {
  const [selectedPreviewStatus, setSelectedPreviewStatus] =
    useState<ThemeLoadState>("loading");

  useEffect(() => {
    let cancelled = false;
    void defaultAssetRegistry
      .preload(themeId, "essential")
      .then(() => {
        if (!cancelled) {
          setSelectedPreviewStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedPreviewStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [themeId]);

  return (
    <Badge tone={selectedPreviewStatus === "error" ? "danger" : "neutral"}>
      {selectedPreviewStatus === "loading"
        ? "Loading"
        : selectedPreviewStatus === "error"
          ? "Fallback"
          : "Ready"}
    </Badge>
  );
}
