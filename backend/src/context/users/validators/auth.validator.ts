import { z } from "zod";

const text = z.string().trim().min(1);

export const registerSchema = z
  .object({
    name: text,
    email: z.string().trim().email(),
    password: z.string().min(8),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: text,
  })
  .strict();

export const logoutSchema = refreshSchema;
