import { forbidden, notFound } from "@context/shared/errors/app-error";
import { HouseholdModel } from "@context/households/models/household.model";
import { MembershipModel } from "@context/households/models/membership.model";
import type { RealtimeConnectionContext, RealtimeHandshakeRequest, RealtimeHandshakeResponse } from "../contracts";
import { createRealtimeTicket, verifyRealtimeTicket } from "../utils/ticket";

const DEFAULT_TICKET_TTL_MS = 5 * 60 * 1000;

export class RealtimeHandshakeService {
  constructor(private readonly now = () => new Date()) {}

  async createSession(
    actorUserId: string,
    request: RealtimeHandshakeRequest,
  ): Promise<RealtimeHandshakeResponse> {
    const household = await HouseholdModel.findById(request.householdId).lean();
    if (!household) throw notFound("household");
    const membership = await MembershipModel.findOne({
      householdId: request.householdId,
      userId: actorUserId,
      status: "ACTIVE",
    }).lean();
    if (!membership) throw forbidden("an active membership is required");

    const ticket = createRealtimeTicket({
      userId: actorUserId,
      membershipId: membership.id,
      householdId: request.householdId,
      now: this.now(),
      ttlMs: DEFAULT_TICKET_TTL_MS,
    });

    return {
      ticket: ticket.ticket,
      expiresAt: ticket.expiresAt,
      streamUrl: `/api/v1/realtime/stream?ticket=${encodeURIComponent(ticket.ticket)}`,
    };
  }

  validateTicket(ticket: string): RealtimeConnectionContext {
    try {
      return verifyRealtimeTicket(ticket, this.now());
    } catch {
      throw forbidden("realtime ticket is invalid or expired");
    }
  }
}
