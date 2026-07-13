import type { RealtimeDeliveryPolicy, RealtimeEvent } from "../contracts";

export class HouseholdRealtimeDeliveryPolicy implements RealtimeDeliveryPolicy {
  shouldDeliver(event: RealtimeEvent, householdId: string): boolean {
    return event.householdId === householdId;
  }
}
