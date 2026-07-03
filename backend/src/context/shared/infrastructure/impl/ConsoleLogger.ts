export default class ConsoleLogger {
  info(message: unknown): void {
    process.stdout.write(`${typeof message === "string" ? message : JSON.stringify(message)}\n`);
  }

  error(message: unknown): void {
    process.stderr.write(`${typeof message === "string" ? message : JSON.stringify(message)}\n`);
  }
}
