import { verifySession } from "./statelessSession.js";
import { DEFAULT_TOKENS, SEED_NAV, buildSeedPages } from "./designSystemSeed.js";
import {
  createVersion,
  designSystemDatabaseConfigured,
  getLiveVersion,
  getPage,
  getVersionById,
  listPages,
  listVersions,
  publishVersion,
  seedIfEmpty,
  updateVersionTokens,
  type DesignPageRow,
  type DesignVersionRow,
} from "./designSystemDb.js";

export type DesignSystemRequest = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

function header(req: DesignSystemRequest, name: string): string {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] || "";
  return typeof raw === "string" ? raw : "";
}

function pathParts(url?: string): string[] {
  const raw = (url || "").split("?")[0] || "";
  const marker = "/api/design-system";
  const idx = raw.indexOf(marker);
  const rest = idx >= 0 ? raw.slice(idx + marker.length) : raw;
  return rest.split("/").filter(Boolean);
}

function authorizeEditor(req: DesignSystemRequest): { ok: true; who: string } | { ok: false; status: number; error: string } {
  const key = process.env.DESIGN_SYSTEM_KEY || "";
  const auth = header(req, "authorization");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const platform = header(req, "x-design-system-key") || bearer;

  if (key && platform === key) return { ok: true, who: "design-system-key" };

  const session = verifySession(bearer);
  if (session) return { ok: true, who: `site:${session.method}` };

  return { ok: false, status: 401, error: "Sign in (site access) or provide DESIGN_SYSTEM_KEY to publish." };
}

function staticVersion(slug: string, label: string, live: boolean): DesignVersionRow {
  return {
    id: `static-${slug}`,
    slug,
    label,
    status: live ? "published" : "draft",
    isLive: live,
    summary: live ? "Bundled fallback (database not configured)." : "Bundled draft fallback.",
    tokens: DEFAULT_TOKENS,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    publishedAt: live ? new Date(0).toISOString() : null,
    publishedBy: live ? "static" : null,
  };
}

function staticPages(): DesignPageRow[] {
  return buildSeedPages().map((p, i) => ({
    id: `static-${p.section}-${p.slug}`,
    versionId: "static-v1",
    section: p.section,
    slug: p.slug,
    title: p.title,
    sortOrder: p.sortOrder || i,
    lede: p.lede,
    bodyMd: p.bodyMd,
    blocks: [],
    updatedAt: new Date(0).toISOString(),
  }));
}

async function ensureReady() {
  if (!designSystemDatabaseConfigured()) return { mode: "static" as const };
  await seedIfEmpty();
  return { mode: "db" as const };
}

export async function handleDesignSystem(req: DesignSystemRequest): Promise<{ status: number; body: unknown }> {
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") return { status: 204, body: {} };

  const parts = pathParts(req.url);
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const ready = await ensureReady();

    // GET /live
    if (method === "GET" && parts[0] === "live") {
      if (ready.mode === "static") {
        return {
          status: 200,
          body: { version: staticVersion("v1", "Version 1", true), source: "static" },
        };
      }
      const version = await getLiveVersion();
      return { status: 200, body: { version, source: "db" } };
    }

    // GET /nav
    if (method === "GET" && parts[0] === "nav") {
      return { status: 200, body: { nav: SEED_NAV } };
    }

    // GET /versions
    if (method === "GET" && parts[0] === "versions" && parts.length === 1) {
      if (ready.mode === "static") {
        return {
          status: 200,
          body: {
            versions: [staticVersion("v1", "Version 1", true), staticVersion("draft", "Draft", false)],
            source: "static",
          },
        };
      }
      const versions = await listVersions();
      return { status: 200, body: { versions, source: "db" } };
    }

    // POST /versions  (create)
    if (method === "POST" && parts[0] === "versions" && parts.length === 1) {
      const auth = authorizeEditor(req);
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } };
      if (ready.mode === "static") {
        return { status: 503, body: { error: "Configure DESIGN_SYSTEM_DATABASE_URL or DATABASE_URL to create versions." } };
      }
      const slug = String(body.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
      const label = String(body.label || "").trim();
      if (!slug || !label) return { status: 400, body: { error: "slug and label are required" } };
      const copyFromId = typeof body.copyFromId === "string" ? body.copyFromId : undefined;
      const version = await createVersion({
        slug,
        label,
        summary: typeof body.summary === "string" ? body.summary : "",
        tokens: body.tokens && typeof body.tokens === "object" ? (body.tokens as Record<string, string>) : undefined,
        copyFromId,
      });
      return { status: 201, body: { version } };
    }

    // POST /versions/:id/publish
    if (method === "POST" && parts[0] === "versions" && parts[2] === "publish") {
      const auth = authorizeEditor(req);
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } };
      if (ready.mode === "static") {
        return { status: 503, body: { error: "Configure a database to publish versions." } };
      }
      const id = parts[1];
      const version = await publishVersion(id, auth.who);
      if (!version) return { status: 404, body: { error: "Version not found" } };
      return { status: 200, body: { version, live: true } };
    }

    // PATCH /versions/:id/tokens
    if (method === "PATCH" && parts[0] === "versions" && parts[2] === "tokens") {
      const auth = authorizeEditor(req);
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } };
      if (ready.mode === "static") {
        return { status: 503, body: { error: "Configure a database to edit tokens." } };
      }
      const tokens = body.tokens;
      if (!tokens || typeof tokens !== "object") return { status: 400, body: { error: "tokens object required" } };
      const version = await updateVersionTokens(parts[1], tokens as Record<string, string>);
      if (!version) return { status: 404, body: { error: "Version not found" } };
      return { status: 200, body: { version } };
    }

    // GET /versions/:id/pages
    if (method === "GET" && parts[0] === "versions" && parts[2] === "pages" && parts.length === 3) {
      if (ready.mode === "static") {
        return { status: 200, body: { pages: staticPages(), source: "static" } };
      }
      const pages = await listPages(parts[1]);
      return { status: 200, body: { pages, source: "db" } };
    }

    // GET /versions/:id/pages/:section/:slug
    if (method === "GET" && parts[0] === "versions" && parts[2] === "pages" && parts.length === 5) {
      const [, id, , section, slug] = parts;
      if (ready.mode === "static") {
        const page = staticPages().find((p) => p.section === section && p.slug === slug);
        if (!page) return { status: 404, body: { error: "Page not found" } };
        return { status: 200, body: { page, source: "static" } };
      }
      let page = await getPage(id, section, slug);
      const seed = buildSeedPages().find((p) => p.section === section && p.slug === slug);
      const preferSeedDocs =
        seed &&
        ((section === "components" &&
          (slug === "phone" || slug === "date-of-birth" || slug === "field" || slug === "selection")) ||
          (section === "patterns" && slug === "forms"));
      if (!page && seed) {
        page = {
          id: `seed-${section}-${slug}`,
          versionId: id,
          section: seed.section,
          slug: seed.slug,
          title: seed.title,
          sortOrder: seed.sortOrder,
          lede: seed.lede,
          bodyMd: seed.bodyMd,
          blocks: [],
          updatedAt: new Date().toISOString(),
        };
      } else if (page && preferSeedDocs && seed) {
        page = {
          ...page,
          title: seed.title,
          lede: seed.lede,
          bodyMd: seed.bodyMd,
        };
      }
      if (!page) return { status: 404, body: { error: "Page not found" } };
      return { status: 200, body: { page, source: "db" } };
    }

    // GET /versions/:id
    if (method === "GET" && parts[0] === "versions" && parts.length === 2) {
      if (ready.mode === "static") {
        const v = parts[1] === "draft" ? staticVersion("draft", "Draft", false) : staticVersion("v1", "Version 1", true);
        return { status: 200, body: { version: v, source: "static" } };
      }
      const version = await getVersionById(parts[1]);
      if (!version) return { status: 404, body: { error: "Version not found" } };
      return { status: 200, body: { version, source: "db" } };
    }

    // POST /seed
    if (method === "POST" && parts[0] === "seed") {
      const auth = authorizeEditor(req);
      if (!auth.ok) return { status: auth.status, body: { error: auth.error } };
      if (ready.mode === "static") {
        return { status: 503, body: { error: "Configure a database to seed." } };
      }
      const result = await seedIfEmpty();
      return { status: 200, body: result };
    }

    return { status: 404, body: { error: "Not found" } };
  } catch (err) {
    console.error("[design-system]", err);
    return { status: 500, body: { error: "Design system unavailable" } };
  }
}
