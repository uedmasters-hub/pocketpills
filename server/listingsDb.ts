import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let migrated = false;

export function listingsDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (sqlClient) return sqlClient;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  sqlClient = neon(url);
  return sqlClient;
}

export type ListingRow = {
  owner_id: string;
  vendor_type: string;
  published_id: string | null;
  status: string;
  draft: unknown;
  published: unknown;
  updated_at: string;
};

export async function ensureListingsSchema() {
  if (migrated) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS provider_listings (
      owner_id TEXT PRIMARY KEY,
      vendor_type TEXT NOT NULL,
      published_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      draft JSONB NOT NULL DEFAULT '{}'::jsonb,
      published JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS provider_listings_published_id_live
      ON provider_listings (published_id)
      WHERE status = 'published' AND published_id IS NOT NULL
  `;
  await sql`CREATE INDEX IF NOT EXISTS provider_listings_status_idx ON provider_listings (status)`;
  migrated = true;
}

export async function upsertListingDraft(ownerId: string, vendorType: string, draft: unknown) {
  const sql = getSql();
  await ensureListingsSchema();
  await sql`
    INSERT INTO provider_listings (owner_id, vendor_type, draft, updated_at)
    VALUES (${ownerId}, ${vendorType}, ${JSON.stringify(draft)}::jsonb, now())
    ON CONFLICT (owner_id) DO UPDATE SET
      vendor_type = EXCLUDED.vendor_type,
      draft = EXCLUDED.draft,
      updated_at = now()
  `;
}

export async function publishListing(ownerId: string, vendorType: string, publishedId: string, payload: unknown) {
  const sql = getSql();
  await ensureListingsSchema();
  const body = JSON.stringify(payload);
  await sql`
    INSERT INTO provider_listings (owner_id, vendor_type, published_id, status, draft, published, updated_at)
    VALUES (${ownerId}, ${vendorType}, ${publishedId}, 'published', ${body}::jsonb, ${body}::jsonb, now())
    ON CONFLICT (owner_id) DO UPDATE SET
      vendor_type = EXCLUDED.vendor_type,
      published_id = EXCLUDED.published_id,
      status = 'published',
      draft = EXCLUDED.draft,
      published = EXCLUDED.published,
      updated_at = now()
  `;
}

export async function unpublishListing(ownerId: string) {
  const sql = getSql();
  await ensureListingsSchema();
  await sql`
    UPDATE provider_listings
    SET status = 'draft', updated_at = now()
    WHERE owner_id = ${ownerId}
  `;
}

export async function getListingByOwner(ownerId: string): Promise<ListingRow | null> {
  const sql = getSql();
  await ensureListingsSchema();
  const rows = (await sql`
    SELECT owner_id, vendor_type, published_id, status, draft, published, updated_at::text
    FROM provider_listings
    WHERE owner_id = ${ownerId}
    LIMIT 1
  `) as ListingRow[];
  return rows[0] ?? null;
}

export async function getPublishedListing(publishedId: string): Promise<ListingRow | null> {
  const sql = getSql();
  await ensureListingsSchema();
  const rows = (await sql`
    SELECT owner_id, vendor_type, published_id, status, draft, published, updated_at::text
    FROM provider_listings
    WHERE published_id = ${publishedId} AND status = 'published'
    LIMIT 1
  `) as ListingRow[];
  return rows[0] ?? null;
}

export async function listPublishedListings(): Promise<ListingRow[]> {
  const sql = getSql();
  await ensureListingsSchema();
  return (await sql`
    SELECT owner_id, vendor_type, published_id, status, draft, published, updated_at::text
    FROM provider_listings
    WHERE status = 'published' AND published_id IS NOT NULL
    ORDER BY updated_at DESC
  `) as ListingRow[];
}
