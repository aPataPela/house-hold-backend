import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1).default("mongodb://localhost:27017/household"),
  LOG_LEVEL: z.string().default("info"),
});

export const env = schema.parse(process.env);
