import type { RealtimeConnection, RealtimeSubscriptionRegistry } from "../contracts";

export class InMemoryRealtimeSubscriptionRegistry implements RealtimeSubscriptionRegistry {
  private readonly households = new Map<string, Map<string, RealtimeConnection>>();

  add(connection: RealtimeConnection): void {
    const connections = this.households.get(connection.householdId) ?? new Map<string, RealtimeConnection>();
    connections.set(connection.connectionId, connection);
    this.households.set(connection.householdId, connections);
  }

  remove(connectionId: string): void {
    for (const [householdId, connections] of this.households.entries()) {
      if (!connections.has(connectionId)) continue;
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.households.delete(householdId);
      }
      break;
    }
  }

  list(householdId: string): RealtimeConnection[] {
    return [...(this.households.get(householdId)?.values() ?? [])];
  }

  count(householdId?: string): number {
    if (householdId) {
      return this.households.get(householdId)?.size ?? 0;
    }
    let total = 0;
    for (const connections of this.households.values()) total += connections.size;
    return total;
  }
}

export const sharedRealtimeSubscriptionRegistry = new InMemoryRealtimeSubscriptionRegistry();
