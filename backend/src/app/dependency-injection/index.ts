import { ContainerBuilder, YamlFileLoader } from "node-dependency-injection";

declare global {
  var __householdNow: (() => Date) | undefined;
}

if (process.env.NODE_ENV === "test") {
  // Required by node-dependency-injection v2 when YAML classes point to TypeScript files.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("ts-node/register");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("tsconfig-paths/register");
}

const container = new ContainerBuilder();
const loader = new YamlFileLoader(container);

container.register("App.Now");
container.set("App.Now", () => (globalThis.__householdNow ?? (() => new Date()))());

loader.load(`${__dirname}/application.yaml`);
container.compile();

export const setAppNow = (value: () => Date): void => {
  globalThis.__householdNow = value;
};

export default container;
