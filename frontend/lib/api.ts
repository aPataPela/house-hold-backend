const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

const friendlyErrors: Record<string, string> = {
  EMAIL_EXISTS: "Ese correo ya tiene una cuenta.",
  INVALID_CREDENTIALS: "El correo o la contraseña no coinciden.",
  INACTIVE_ACTOR: "Tu membresía ya no está activa para registrar ese gasto.",
  INACTIVE_PAYER: "El pagador debe estar activo en la fecha del gasto.",
  OVERLAPPING_EXCLUSION: "Ya existe una pausa para esas fechas.",
  OVERLAPPING_PREFERENCE: "La regla se cruza con otro período configurado.",
  EXCLUSION_ALREADY_CANCELLED: "Esa pausa ya fue cancelada.",
  INVALID_PARTICIPANTS: "Al menos una persona debe participar.",
  INVALID_PARTICIPATION_RULE: "La regla de participación es inválida.",
  INVALID_PERIOD: "Revisa las fechas: la fecha final debe ser posterior.",
  INVALID_PAYMENT_MEMBER: "No puedes registrar ese pago para esa persona.",
  OVERPAYMENT: "El monto supera la deuda pendiente.",
  INVALID_AMOUNT: "El monto debe ser mayor a cero.",
  VALIDATION_ERROR: "Revisa los datos ingresados e inténtalo otra vez.",
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<T> {
  const { accessToken, ...requestInit } = init ?? {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...requestInit.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const code =
      typeof body?.error?.code === "string" ? body.error.code : "API_ERROR";
    const fallback =
      response.status === 403
        ? "No tienes permiso para realizar esta acción."
        : "No pudimos completar la acción. Inténtalo nuevamente.";
    throw new ApiError(friendlyErrors[code] ?? fallback, code, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
