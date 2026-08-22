import { readSiteAccessSession } from "@/lib/siteAccess";

export type DesignVersion = {
  id: string;
  slug: string;
  label: string;
  status: "draft" | "published" | "archived";
  isLive: boolean;
  summary: string;
  tokens: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
};

export type DesignPage = {
  id: string;
  versionId: string;
  section: string;
  slug: string;
  title: string;
  sortOrder: number;
  lede: string;
  bodyMd: string;
  blocks: unknown[];
  updatedAt: string;
};

export type DesignNavGroup = {
  section: string;
  label: string;
  items: { slug: string; title: string }[];
};

async function dsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSiteAccessSession();
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  if (session?.sessionToken) headers.set("Authorization", `Bearer ${session.sessionToken}`);

  const res = await fetch(`/api/design-system${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data;
}

export function fetchLiveDesign() {
  return dsFetch<{ version: DesignVersion | null; source: string }>("/live");
}

export function fetchDesignNav() {
  return dsFetch<{ nav: DesignNavGroup[] }>("/nav");
}

export function fetchDesignVersions() {
  return dsFetch<{ versions: DesignVersion[]; source: string }>("/versions");
}

export function fetchDesignPages(versionId: string) {
  return dsFetch<{ pages: DesignPage[]; source: string }>(`/versions/${versionId}/pages`);
}

export function fetchDesignPage(versionId: string, section: string, slug: string) {
  return dsFetch<{ page: DesignPage; source: string }>(`/versions/${versionId}/pages/${section}/${slug}`);
}

export function createDesignVersion(input: {
  slug: string;
  label: string;
  summary?: string;
  copyFromId?: string;
}) {
  return dsFetch<{ version: DesignVersion }>("/versions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function publishDesignVersion(id: string) {
  return dsFetch<{ version: DesignVersion; live: boolean }>(`/versions/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function applyDesignTokens(tokens: Record<string, string> | null | undefined) {
  if (!tokens || typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    if (!key.startsWith("--") || !value) continue;
    root.style.setProperty(key, value);
  }
  // Keep semantic aliases in sync when primitives change
  if (tokens["--primary-950"]) root.style.setProperty("--pp-primary-950", tokens["--primary-950"]);
  if (tokens["--primary-600"]) root.style.setProperty("--pp-violet", tokens["--primary-600"]);
  if (tokens["--primary-300"]) {
    root.style.setProperty("--pp-lavender", tokens["--primary-300"]);
    root.style.setProperty("--pp-primary-300", tokens["--primary-300"]);
  }
  if (tokens["--primary-200"]) {
    root.style.setProperty("--pp-primary-200", tokens["--primary-200"]);
    root.style.setProperty("--pp-primary-100", tokens["--primary-200"]);
    root.style.setProperty("--pp-page", tokens["--primary-200"]);
  }
}
