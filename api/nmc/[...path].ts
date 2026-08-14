import type { IncomingMessage, ServerResponse } from "node:http";
import { lookupDoctor, searchDoctors, verifyDoctor } from "../../server/nmcProxy.js";
import { localRegistryAvailable } from "../../server/nmcRegistry.js";

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

function nmcPath(url?: string | null) {
  const raw = (url || "").split("?")[0] || "";
  const marker = "/api/nmc";
  const idx = raw.indexOf(marker);
  const rest = idx >= 0 ? raw.slice(idx + marker.length) : raw;
  return rest.replace(/\/+$/, "") || "/";
}

function qstr(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  const method = (req.method || "GET").toUpperCase();
  const pathname = nmcPath(req.url);
  const query = req.query || {};

  if (method === "GET" && (pathname === "/health" || pathname === "/")) {
    sendJson(res, 200, { status: "ok", service: "nmc-registry", local: localRegistryAvailable() });
    return;
  }

  if (method === "GET" && pathname === "/doctors") {
    const result = await searchDoctors({
      q: qstr(query.q),
      name: qstr(query.name),
      address: qstr(query.address),
      page: qstr(query.page),
      limit: qstr(query.limit),
    });
    sendJson(res, result.status, result.body);
    return;
  }

  const lookup = /^\/lookup\/([^/]+)$/.exec(pathname);
  if (method === "GET" && lookup) {
    const result = await lookupDoctor(decodeURIComponent(lookup[1]));
    sendJson(res, result.status, result.body);
    return;
  }

  if (method === "POST" && pathname === "/verify") {
    let body: Record<string, unknown> = {};
    try {
      const parsed = await readJsonBody(req);
      body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
      return;
    }
    const result = await verifyDoctor(String(body.nmcNumber ?? ""), String(body.lastName ?? ""));
    sendJson(res, result.status, result.body);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}
