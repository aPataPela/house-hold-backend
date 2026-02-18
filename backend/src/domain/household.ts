export type CurrencyCode = "CLP";
export type CategoryParticipationApprovalMode = "ADMIN_ONLY";

export interface GovernanceSettings {
  categoryParticipationApprovalMode: CategoryParticipationApprovalMode;
}

export interface Household {
  id: string;
  name: string;
  currency: CurrencyCode;
  governanceSettings: GovernanceSettings;
  createdAt: Date;
}
