import express from "express";
import cors from "cors";
import { handleAccess, type AccessRequest } from "./accessApi.js";
import { lookupDoctor, searchDoctors, verifyDoctor } from "./nmcProxy.js";
import { listPharmacyDistricts, lookupPharmacy, searchPharmacies, verifyPharmacy } from "./pharmacyProxy.js";
import { listFacilityDistricts, lookupFacility, searchFacilities, verifyFacility } from "./facilityProxy.js";
import { handleReviews } from "./reviewsApi.js";

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
  if (result.status === 204) {
    res.status(204).end();
    return;
  }
  res.status(result.status).json(result.body);
}

export function createAccessApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "32kb" }));

  app.all("/api/access/password", (req, res) => run("password", req, res));
  app.all("/api/access/magic-link", (req, res) => run("magic-link", req, res));
  app.all("/api/access/verify", (req, res) => run("verify", req, res));
  app.all("/api/access/session", (req, res) => run("session", req, res));
  app.all("/api/access/health", (req, res) => run("health", req, res));

  app.get("/api/nmc/lookup", async (req, res) => {
    const nmc = typeof req.query.nmc === "string" ? req.query.nmc : typeof req.query.nmcNumber === "string" ? req.query.nmcNumber : "";
    const result = await lookupDoctor(nmc);
    res.status(result.status).json(result.body);
  });
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

  app.get("/api/pharmacy/health", (_req, res) => {
    res.json({ status: "ok", service: "dda-pharmacy-registry" });
  });

  app.get("/api/pharmacy/districts", async (_req, res) => {
    const result = await listPharmacyDistricts();
    res.status(result.status).json(result.body);
  });

  app.get("/api/pharmacy/list", async (req, res) => {
    const result = await searchPharmacies({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      name: typeof req.query.name === "string" ? req.query.name : undefined,
      district: typeof req.query.district === "string" ? req.query.district : undefined,
      place: typeof req.query.place === "string" ? req.query.place : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    res.status(result.status).json(result.body);
  });

  app.get("/api/pharmacy/lookup", async (req, res) => {
    const reg =
      typeof req.query.reg === "string"
        ? req.query.reg
        : typeof req.query.registrationNo === "string"
          ? req.query.registrationNo
          : "";
    const result = await lookupPharmacy(reg);
    res.status(result.status).json(result.body);
  });
  app.get("/api/pharmacy/lookup/:registrationNo", async (req, res) => {
    const result = await lookupPharmacy(req.params.registrationNo);
    res.status(result.status).json(result.body);
  });

  app.post("/api/pharmacy/verify", async (req, res) => {
    const registrationNo = String(req.body?.registrationNo ?? "");
    const nameToken = String(req.body?.nameToken ?? req.body?.name ?? "");
    const result = await verifyPharmacy(registrationNo, nameToken);
    res.status(result.status).json(result.body);
  });

  app.get("/api/facility/health", (_req, res) => {
    res.json({ status: "ok", service: "health-facility-registry" });
  });

  app.get("/api/facility/districts", async (_req, res) => {
    const result = await listFacilityDistricts();
    res.status(result.status).json(result.body);
  });

  app.get("/api/facility/list", async (req, res) => {
    const result = await searchFacilities({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      name: typeof req.query.name === "string" ? req.query.name : undefined,
      district: typeof req.query.district === "string" ? req.query.district : undefined,
      facilityLevel: typeof req.query.facilityLevel === "string" ? req.query.facilityLevel : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    res.status(result.status).json(result.body);
  });

  app.get("/api/facility/lookup", async (req, res) => {
    const hf =
      typeof req.query.hf === "string" ? req.query.hf : typeof req.query.hfCode === "string" ? req.query.hfCode : "";
    const result = await lookupFacility(hf);
    res.status(result.status).json(result.body);
  });
  app.get("/api/facility/lookup/:hfCode", async (req, res) => {
    const result = await lookupFacility(req.params.hfCode);
    res.status(result.status).json(result.body);
  });

  app.post("/api/facility/verify", async (req, res) => {
    const hfCode = String(req.body?.hfCode ?? "");
    const nameToken = String(req.body?.nameToken ?? req.body?.name ?? "");
    const result = await verifyFacility(hfCode, nameToken);
    res.status(result.status).json(result.body);
  });

  app.use("/api/reviews", (req, res) => {
    void runReviews(req, res);
  });

  return app;
}

async function runReviews(req: express.Request, res: express.Response) {
  const result = await handleReviews({
    method: req.method,
    url: req.originalUrl || req.url,
    headers: req.headers as Record<string, string | string[] | undefined>,
    body: req.body,
    query: req.query as Record<string, string | string[] | undefined>,
  });
  res.status(result.status).json(result.body);
}
