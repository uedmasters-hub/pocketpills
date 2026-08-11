import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAccess } from "../../server/accessApi.js";

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

function routeFromUrl(
  url?: string | null,
): "password" | "magic-link" | "verify" | "session" | "health" | null {
  const path = (url || "").split("?")[0] || "";
  if (path.endsWith("/password") || path === "/password") return "password";
  if (path.endsWith("/magic-link") || path === "/magic-link") return "magic-link";
  if (path.endsWith("/verify") || path === "/verify") return "verify";
  if (path.endsWith("/session") || path === "/session") return "session";
  if (path.endsWith("/health") || path === "/health") return "health";
  return null;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  const route = routeFromUrl(req.url);
  if (!route) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  let body: unknown = {};
  try {
    if ((req.method || "GET").toUpperCase() !== "GET") {
      body = await readJsonBody(req);
    }
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const result = await handleAccess(route, {
    method: req.method,
    headers: req.headers as Record<string, string | string[] | undefined>,
    body,
    query: req.query,
    socketRemoteAddress: req.socket?.remoteAddress || null,
  });

  sendJson(res, result.status, result.body);
}
