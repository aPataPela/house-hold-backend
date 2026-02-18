export type MemberCategoryPreferenceMode = "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT";

export interface MemberCategoryPreference {
  id: string;
  householdId: string;
  membershipId: string;
  categoryId: string;
  mode: MemberCategoryPreferenceMode;
  weight: number;
  validFrom: Date;
  validTo?: Date | null;
}

export const isPreferenceValidOn = (preference: MemberCategoryPreference, date: Date): boolean => {
  if (preference.validFrom > date) {
    return false;
  }

  if (preference.validTo && date >= preference.validTo) {
    return false;
  }

  return true;
};
