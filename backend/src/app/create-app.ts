import type { Express } from "express";
import { setAppNow } from "@app/dependency-injection";
import { Server } from "@app/server/Server";

export const createApp = (options: { now?: () => Date; logging?: boolean } = {}): Express => {
  if (options.now) setAppNow(options.now);
  return new Server(0, options.logging === undefined ? {} : { logging: options.logging }).app;
};
