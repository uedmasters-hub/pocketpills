import type { IncomingMessage, ServerResponse } from "node:http";
import { handleDesignSystem } from "../../server/designSystemApi.js";

type VercelRequest = IncomingMessage & {
  method?: string;
  query?: Record<string, string | string[]>;
  body?: unknown;
};

function readJsonBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  let body: unknown = {};
  try {
    if ((req.method || "GET").toUpperCase() !== "GET") {
      body = await readJsonBody(req);
    }
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const result = await handleDesignSystem({
    method: req.method,
    url: req.url,
    headers: req.headers as Record<string, string | string[] | undefined>,
    body,
  });
  sendJson(res, result.status, result.body);
}
