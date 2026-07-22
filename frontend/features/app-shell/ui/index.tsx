"use client";

import type { ReactNode } from "react";
import { Badge, BottomNavigation, Card, FunctionalIcon, ThemeArtwork, ThemeBackground, ThemeHomeIcon, Toast } from "@/design-system";
import { ThemeSwitcher } from "@/design-system/theme";
import type { AppSection, Session } from "@/lib/domain";

export interface AppShellPermissions {
  canManageHouse: boolean;
  canManageMembers?: boolean;
  canManageRules?: boolean;
}

export interface AppShellProps {
  session: Session;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  permissions: AppShellPermissions;
  children: ReactNode;
  notifications?: ReactNode;
  modals?: ReactNode;
}

export function AppShell({
  session,
  activeSection,
  onSectionChange,
  permissions,
  children,
  notifications,
  modals,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <ThemeBackground slot="appBackground" className="app-shell__background" loading="eager" fetchPriority="high" />
      <header className="app-shell__header ds-glass-surface">
        <div className="app-shell__header-copy">
          <p className="eyebrow">{session.householdName ?? "Shared Household"}</p>
          <h1>{session.currentUserName}</h1>
        </div>
        <div className="app-shell__header-actions">
          <Badge tone={permissions.canManageHouse ? "success" : "neutral"}>
            {permissions.canManageHouse ? "Admin" : "Miembro"}
          </Badge>
          <ThemeSwitcher />
        </div>
      </header>

      {notifications ? <div className="app-shell__status">{notifications}</div> : null}

      <main className="app-shell__main">
        <div className="app-shell__content">{children}</div>
      </main>

      <footer className="app-shell__footer">
        <ThemeArtwork
          slot="footerDecoration"
          decorative
          loading="eager"
          fetchPriority="low"
          className="app-shell__footer-decoration"
        />
        <BottomNavigation
          value={activeSection}
          onChange={(value) => onSectionChange(value as AppSection)}
          items={[
            {
              value: "home",
              label: "Inicio",
              icon: (active) => <ThemeHomeIcon state={active ? "active" : "inactive"} size={20} />,
            },
            { value: "expenses", label: "Gastos", icon: <FunctionalIcon name="gastos" size={20} /> },
            { value: "rules", label: "Reglas", icon: <FunctionalIcon name="reglas" size={20} /> },
            { value: "absences", label: "Ausencias", icon: <FunctionalIcon name="ausencia" size={20} /> },
            { value: "house", label: "Casa", icon: <FunctionalIcon name="casa" size={20} /> },
          ]}
        />
      </footer>

      {modals ? <div className="app-shell__overlays">{modals}</div> : null}
    </div>
  );
}

export interface AppNotificationProps {
  title: string;
  description?: string;
  tone?: "info" | "success" | "warning" | "danger";
}

export function AppNotification(props: AppNotificationProps) {
  return (
    <Card padding="none">
      <Toast {...props} />
    </Card>
  );
}
