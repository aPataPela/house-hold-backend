export interface Category {
  id: string;
  householdId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
}
