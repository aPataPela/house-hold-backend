import { requestJson } from "../core/http-client";
import { RepositoryCache, cacheKey } from "../core/cache";
import { DataAccessError } from "../core/errors";
import { normalizeDate } from "../core/normalize";
import type { RequestContext } from "../core/types";
import { createFakeDataStore, createFakeId, type FakeDataStore, type FakeDataStoreSeed } from "../core/fake-store";
import type { InviteCodeResult, InviteMemberCommand, Member } from "../models";

export interface MemberDto {
  membershipId: string;
  householdId: string;
  householdName?: string;
  userId: string;
  userName?: string;
  role: Member["role"];
  status: Member["status"];
  joinedAt: string;
  livingSince: string;
}

export interface MembersListResponseDto {
  memberships: MemberDto[];
}

export interface InviteMemberCommandDto {
  userId: string;
  role: Member["role"];
  invitedByMembershipId: string;
  livingSince?: string;
}

export interface InviteMemberResponseDto {
  membership: MemberDto;
}

export interface RegenerateInviteCodeResponseDto {
  householdId: string;
  inviteCode: string;
}

export interface MembersRepository {
  list(householdId: string, context?: RequestContext): Promise<Member[]>;
  invite(
    householdId: string,
    command: InviteMemberCommand,
    context?: RequestContext,
  ): Promise<Member>;
  regenerateInviteCode(householdId: string, context?: RequestContext): Promise<InviteCodeResult>;
}

export function mapMemberDtoToMember(dto: MemberDto): Member {
  return {
    membershipId: dto.membershipId,
    householdId: dto.householdId,
    householdName: dto.householdName,
    userId: dto.userId,
    userName: dto.userName,
    role: dto.role,
    status: dto.status,
    joinedAt: normalizeDate(dto.joinedAt),
    livingSince: normalizeDate(dto.livingSince),
  };
}

export function mapMemberToDto(member: Member): MemberDto {
  return {
    membershipId: member.membershipId,
    householdId: member.householdId,
    householdName: member.householdName,
    userId: member.userId,
    userName: member.userName,
    role: member.role,
    status: member.status,
    joinedAt: normalizeDate(member.joinedAt),
    livingSince: normalizeDate(member.livingSince),
  };
}

export function mapInviteMemberCommandToDto(command: InviteMemberCommand): InviteMemberCommandDto {
  return {
    userId: command.userId,
    role: command.role,
    invitedByMembershipId: command.invitedByMembershipId,
    ...(command.livingSince ? { livingSince: normalizeDate(command.livingSince) } : {}),
  };
}

export function createMembersHttpRepository(options: { ttlMs?: number } = {}): MembersRepository {
  const cache = new RepositoryCache<Member[]>({ ttlMs: options.ttlMs });

  return {
    async list(householdId, context) {
      const key = cacheKey("members:list", householdId);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return cached.map((member) => ({ ...member }));
      }

      const response = await requestJson<MembersListResponseDto>(
        `/api/v1/households/${householdId}/memberships`,
        {
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      const members = response.memberships.map(mapMemberDtoToMember);
      cache.set(key, members);
      return members.map((member) => ({ ...member }));
    },

    async invite(householdId, command, context) {
      const response = await requestJson<InviteMemberResponseDto>(
        `/api/v1/households/${householdId}/memberships`,
        {
          method: "POST",
          body: JSON.stringify(mapInviteMemberCommandToDto(command)),
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      cache.invalidatePrefix("members:list:");
      cache.invalidatePrefix("presence:");
      return mapMemberDtoToMember(response.membership);
    },

    async regenerateInviteCode(householdId, context) {
      const response = await requestJson<RegenerateInviteCodeResponseDto>(
        `/api/v1/households/${householdId}/invite-code/regenerate`,
        {
          method: "POST",
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      if (response.householdId !== householdId) {
        throw new DataAccessError("INVALID_INPUT", "Invite code response does not match the household.");
      }

      cache.invalidatePrefix("members:list:");
      return { householdId: response.householdId, inviteCode: response.inviteCode };
    },
  };
}

export function createFakeMembersRepository(seed: FakeDataStoreSeed = {}): MembersRepository {
  const store = createFakeDataStore(seed);
  return createFakeMembersRepositoryFromStore(store);
}

export function createFakeMembersRepositoryFromStore(store: FakeDataStore): MembersRepository {
  return {
    async list(householdId) {
      return store.members.filter((member) => member.householdId === householdId).map((member) => ({ ...member }));
    },
    async invite(householdId, command) {
      const now = new Date().toISOString().slice(0, 10);
      const member: Member = {
        membershipId: createFakeId(store, "member", "membership"),
        householdId,
        userId: command.userId,
        role: command.role,
        status: "ACTIVE",
        joinedAt: now,
        livingSince: normalizeDate(command.livingSince ?? now),
      };
      store.members.push(member);
      store.inviteCodes.delete(householdId);
      return { ...member };
    },
    async regenerateInviteCode(householdId) {
      const inviteCode = `${householdId.slice(0, 4).toUpperCase()}-${createFakeId(store, "inviteCode", "code")}`;
      store.inviteCodes.set(householdId, inviteCode);
      return { householdId, inviteCode };
    },
  };
}
