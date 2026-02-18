export const sendJson = (res: any, statusCode: number, payload: unknown): void => {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(body);
};
