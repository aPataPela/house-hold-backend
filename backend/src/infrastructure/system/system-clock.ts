import type { Clock } from "../../application/ports/services.js";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
