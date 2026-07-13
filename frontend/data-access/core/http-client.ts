import { apiRequest } from "@/lib/api";
import { mapToDataAccessError } from "./errors";
import type { RequestContext } from "./types";

export async function requestJson<T>(
  path: string,
  init?: RequestInit & RequestContext,
): Promise<T> {
  try {
    const { accessToken, ...requestInit } = init ?? {};
    return await apiRequest<T>(path, {
      ...requestInit,
      accessToken,
    });
  } catch (error) {
    throw mapToDataAccessError(error);
  }
}

