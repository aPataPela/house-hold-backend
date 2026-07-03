import type { Router } from "express";
import glob from "glob";

export function registerRoutes(router: Router): void {
  const routes = glob.sync(`${__dirname}/**/*.route.*`);
  routes.forEach((route) => register(route, router));
}

function register(routePath: string, router: Router): void {
  // Mirrors ms-checkout-ecommerce route auto-discovery.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const route = require(routePath) as { register: (router: Router) => void };
  route.register(router);
}
