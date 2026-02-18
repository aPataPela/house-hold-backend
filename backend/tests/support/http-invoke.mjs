export const invoke = async (handler, req) => {
  let responseBody = "";
  const headers = new Map();

  const res = {
    statusCode: 200,
    setHeader: (name, value) => {
      headers.set(String(name).toLowerCase(), value);
    },
    end: (body) => {
      responseBody = body ?? "";
    },
  };

  await handler(req, res);

  return {
    statusCode: res.statusCode,
    headers,
    body: responseBody ? JSON.parse(responseBody) : {},
  };
};
