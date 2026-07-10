import type { AppSection } from "@/lib/domain";

export const TUTORIAL_VERSION = 2;

export type TutorialStep = {
  id: string;
  section: AppSection;
  title: string;
  message: string;
  roles?: Array<"ADMIN" | "MEMBER">;
};

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    section: "home",
    title: "Bienvenido a Casa Viva",
    message: "Te mostramos lo básico para ordenar los gastos de la casa.",
  },
  {
    id: "home",
    section: "home",
    title: "Tu mes de un vistazo",
    message:
      "En Inicio ves tu saldo, el gasto total y los últimos movimientos.",
  },
  {
    id: "expenses",
    section: "expenses",
    title: "Todos los gastos",
    message: "Aquí registras pagos y revisas los movimientos de cada mes.",
  },
  {
    id: "rules",
    section: "rules",
    title: "Un reparto más justo",
    message:
      "En Reglas defines quién participa y cuánto aporta en cada categoría.",
  },
  {
    id: "absences",
    section: "absences",
    title: "Ausencias de convivencia",
    message:
      "En Ausencias registras salidas por rango de fechas y revisas la liquidación mensual.",
  },
  {
    id: "house",
    section: "house",
    title: "Tu casa y su gente",
    message: "Aquí encuentras a los integrantes, las invitaciones y esta guía.",
  },
];

export function getTutorialSteps(role?: "ADMIN" | "MEMBER"): TutorialStep[] {
  return tutorialSteps.filter(
    (step) => !step.roles || (role ? step.roles.includes(role) : false),
  );
}

export function tutorialStorageKey(
  userId: string,
  householdId: string,
): string {
  return `casa-viva-tutorial:v${TUTORIAL_VERSION}:${userId}:${householdId}`;
}
