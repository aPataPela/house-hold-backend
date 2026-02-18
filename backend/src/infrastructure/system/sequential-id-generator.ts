import type { IdGenerator } from "../../application/ports/services.js";

export class SequentialIdGenerator implements IdGenerator {
  private seq = 0;

  next(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}`;
  }
}
