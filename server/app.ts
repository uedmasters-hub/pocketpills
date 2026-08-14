import express from "express";
import cors from "cors";
import { handleAccess, type AccessRequest } from "./accessApi.js";
import { lookupDoctor, searchDoctors, verifyDoctor } from "./nmcProxy.js";

function toAccessRequest(req: express.Request): AccessRequest {
  return {
    method: req.method,
    headers: req.headers as AccessRequest["headers"],
    body: req.body,
    query: req.query as AccessRequest["query"],
    socketRemoteAddress: req.socket.remoteAddress || null,
  };
}

async function run(
  route: "password" | "magic-link" | "verify" | "session" | "health",
  req: express.Request,
  res: express.Response,
) {
  const result = await handleAccess(route, toAccessRequest(req));
  res.status(result.status).json(result.body);
}

export function createAccessApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "32kb" }));

  app.post("/api/access/password", (req, res) => run("password", req, res));
  app.post("/api/access/magic-link", (req, res) => run("magic-link", req, res));
  app.post("/api/access/verify", (req, res) => run("verify", req, res));
  app.get("/api/access/session", (req, res) => run("session", req, res));
  app.get("/api/access/health", (req, res) => run("health", req, res));

  app.get("/api/nmc/lookup/:nmcNumber", async (req, res) => {
    const result = await lookupDoctor(req.params.nmcNumber);
    res.status(result.status).json(result.body);
  });

  app.post("/api/nmc/verify", async (req, res) => {
    const nmcNumber = String(req.body?.nmcNumber ?? "");
    const lastName = String(req.body?.lastName ?? "");
    const result = await verifyDoctor(nmcNumber, lastName);
    res.status(result.status).json(result.body);
  });

  app.get("/api/nmc/doctors", async (req, res) => {
    const result = await searchDoctors({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      name: typeof req.query.name === "string" ? req.query.name : undefined,
      address: typeof req.query.address === "string" ? req.query.address : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    res.status(result.status).json(result.body);
  });

  return app;
}
