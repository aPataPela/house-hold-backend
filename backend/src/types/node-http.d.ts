declare module "node:http" {
  export function createServer(
    handler: (req: any, res: any) => void | Promise<void>,
  ): {
    listen: (port: number, host?: string, callback?: () => void) => void;
    close: (callback?: (error?: Error) => void) => void;
    address: () => { port: number } | null;
  };
}
