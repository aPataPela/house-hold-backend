import type { Absence, CommonArea, HouseTask, Member, TaskWeek } from "../models";

export interface FakeDataStoreSeed {
  members?: Member[];
  absences?: Absence[];
  commonAreas?: CommonArea[];
  tasks?: HouseTask[];
  weeks?: TaskWeek[];
  inviteCodes?: Record<string, string>;
  monthlyTotals?: Record<string, number>;
}

export interface FakeDataStore {
  members: Member[];
  absences: Absence[];
  commonAreas: CommonArea[];
  tasks: HouseTask[];
  weeks: TaskWeek[];
  inviteCodes: Map<string, string>;
  monthlyTotals: Map<string, number>;
  counters: Record<string, number>;
}

export function createFakeDataStore(seed: FakeDataStoreSeed = {}): FakeDataStore {
  return {
    members: [...(seed.members ?? [])],
    absences: [...(seed.absences ?? [])],
    commonAreas: [...(seed.commonAreas ?? [])],
    tasks: [...(seed.tasks ?? [])],
    weeks: [...(seed.weeks ?? [])],
    inviteCodes: new Map(Object.entries(seed.inviteCodes ?? {})),
    monthlyTotals: new Map(Object.entries(seed.monthlyTotals ?? {})),
    counters: {
      member: seed.members?.length ?? 0,
      absence: seed.absences?.length ?? 0,
      commonArea: seed.commonAreas?.length ?? 0,
      task: seed.tasks?.length ?? 0,
      week: seed.weeks?.length ?? 0,
      assignment: seed.weeks?.reduce((sum, week) => sum + week.tasks.reduce((taskSum, task) => taskSum + task.assignments.length, 0), 0) ?? 0,
      inviteCode: Object.keys(seed.inviteCodes ?? {}).length,
      monthlyTotal: Object.keys(seed.monthlyTotals ?? {}).length,
    },
  };
}

export function createFakeId(store: FakeDataStore, key: keyof FakeDataStore["counters"], prefix: string): string {
  const next = (store.counters[key] ?? 0) + 1;
  store.counters[key] = next;
  return `${prefix}_${String(next).padStart(4, "0")}`;
}
