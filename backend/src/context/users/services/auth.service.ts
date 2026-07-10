import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Membership, RefreshToken, User } from "../../shared/types/entities";
import { badRequest, conflict, forbidden } from "../../shared/errors/app-error";
import { MembershipModel } from "../../households/models/membership.model";
import { HouseholdModel } from "../../households/models/household.model";
import { RefreshTokenModel } from "../models/refresh-token.model";
import { UserModel } from "../models/user.model";

const scrypt = promisify(scryptCallback);
const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const base64url = (value: Buffer | string) => Buffer.from(value).toString("base64url");
const normalizeEmail = (email: string) => email.trim().toLocaleLowerCase("en");
const tokenSecret = () => process.env.JWT_SECRET ?? "household-v1-dev-secret";

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export class AuthService {
  constructor(private readonly now = () => new Date()) {}

  async register(input: { name: string; email: string; password: string }) {
    const email = normalizeEmail(input.email);
    if (await UserModel.exists({ email })) throw conflict("EMAIL_EXISTS", "email is already registered");
    const now = this.now();
    const user: User = {
      id: id("usr"),
      name: input.name.trim(),
      email,
      passwordHash: await this.hashPassword(input.password),
      createdAt: now,
    };
    await UserModel.create({ ...user, _id: user.id });
    const tokens = await this.issueSession(user);
    return { user, ...tokens };
  }

  async login(input: { email: string; password: string }) {
    const user = plain<User | null>(await UserModel.findOne({ email: normalizeEmail(input.email) }).lean());
    if (!user || !(await this.verifyPassword(input.password, user.passwordHash))) {
      throw badRequest("INVALID_CREDENTIALS", "email or password is invalid");
    }
    const memberships = await this.findMemberships(user.id, user.name);
    const tokens = await this.issueSession(user);
    return { user, memberships, ...tokens };
  }

  async refresh(input: { refreshToken: string }) {
    const tokenHash = this.hashRefreshToken(input.refreshToken);
    const stored = plain<RefreshToken | null>(
      await RefreshTokenModel.findOne({ tokenHash, revokedAt: { $exists: false } }).lean(),
    );
    if (!stored || stored.expiresAt <= this.now()) {
      throw forbidden("refresh token is invalid or expired");
    }
    const user = plain<User | null>(await UserModel.findById(stored.userId).lean());
    if (!user) throw forbidden("refresh token is invalid or expired");
    await RefreshTokenModel.updateOne({ _id: stored.id }, { $set: { revokedAt: this.now() } });
    return this.issueSession(user);
  }

  async logout(input: { refreshToken: string }) {
    await RefreshTokenModel.updateOne(
      { tokenHash: this.hashRefreshToken(input.refreshToken), revokedAt: { $exists: false } },
      { $set: { revokedAt: this.now() } },
    );
  }

  async authenticate(accessToken: string) {
    const payload = this.verifyAccessToken(accessToken);
    const user = plain<User | null>(await UserModel.findById(payload.sub).lean());
    if (!user) throw forbidden("access token user does not exist");
    return user;
  }

  async me(userId: string) {
    const user = plain<User | null>(await UserModel.findById(userId).lean());
    if (!user) throw forbidden("access token user does not exist");
    return { user, memberships: await this.findMemberships(user.id, user.name) };
  }

  private async issueSession(user: User) {
    const refreshToken = randomBytes(32).toString("base64url");
    const now = this.now();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const token: RefreshToken = {
      id: id("rt"),
      userId: user.id,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
      createdAt: now,
    };
    await RefreshTokenModel.create({ ...token, _id: token.id });
    return { accessToken: this.signAccessToken(user), refreshToken };
  }

  private async findMemberships(userId: string, userName: string) {
    const memberships = plain<Membership[]>(
      await MembershipModel.find({ userId, status: "ACTIVE" }).sort({ joinedAt: 1 }).lean(),
    );
    const householdIds = memberships.map((membership) => membership.householdId);
    const households = plain<Array<{ id: string; name: string }>>(
      await HouseholdModel.find({ _id: { $in: householdIds } }).lean(),
    );
    const householdNames = new Map(households.map((household) => [household.id, household.name]));
    return memberships.map((membership) => {
      const householdName = householdNames.get(membership.householdId);
      return {
        ...membership,
        userName,
        ...(householdName ? { householdName } : {}),
      };
    });
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("base64url");
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${derived.toString("base64url")}`;
  }

  private async verifyPassword(password: string, stored: string) {
    const [algorithm, salt, hash] = stored.split(":");
    if (algorithm !== "scrypt" || !salt || !hash) return false;
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hash, "base64url");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }

  private hashRefreshToken(token: string) {
    return createHmac("sha256", tokenSecret()).update(token).digest("base64url");
  }

  private signAccessToken(user: User) {
    const issuedAt = Math.floor(this.now().getTime() / 1000);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iat: issuedAt,
      exp: Math.floor((this.now().getTime() + ACCESS_TOKEN_TTL_MS) / 1000),
    };
    const header = { alg: "HS256", typ: "JWT" };
    const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
    const signature = createHmac("sha256", tokenSecret()).update(unsigned).digest("base64url");
    return `${unsigned}.${signature}`;
  }

  private verifyAccessToken(token: string): JwtPayload {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) throw forbidden("access token is invalid");
    const expected = createHmac("sha256", tokenSecret()).update(`${header}.${payload}`).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw forbidden("access token is invalid");
    }
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
    if (!decoded.sub || decoded.exp <= Math.floor(this.now().getTime() / 1000)) {
      throw forbidden("access token is invalid or expired");
    }
    return decoded;
  }
}
