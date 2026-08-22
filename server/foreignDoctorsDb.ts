/**
 * Dedicated foreign-doctor registry.
 * Uses FOREIGN_DOCTORS_DATABASE_URL when set so the register can live on its
 * own database. Falls back to DATABASE_URL when unset (including Vercel).
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let migrated = false;

export function foreignDoctorsDatabaseConfigured() {
  return Boolean(process.env.FOREIGN_DOCTORS_DATABASE_URL || process.env.DATABASE_URL);
}

function getSql() {
  if (sqlClient) return sqlClient;
  const url = process.env.FOREIGN_DOCTORS_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("FOREIGN_DOCTORS_DATABASE_URL (or DATABASE_URL) is not set");
  sqlClient = neon(url);
  return sqlClient;
}

export type ForeignDoctorRow = {
  id: string;
  name: string;
  specialty: string;
  council: string;
  registration_no: string;
  country: string;
  image_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ForeignDoctorInput = {
  name: string;
  specialty?: string;
  council?: string;
  registrationNo?: string;
  country?: string;
  imageUrl?: string;
  createdBy?: string;
};

export async function ensureForeignDoctorsSchema() {
  if (migrated) return;
  const sql = getSql();
  await sql`CREATE SCHEMA IF NOT EXISTS foreign_doctor`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    CREATE TABLE IF NOT EXISTS foreign_doctor.doctors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      specialty TEXT NOT NULL DEFAULT '',
      council TEXT NOT NULL DEFAULT '',
      registration_no TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS foreign_doctor_name_idx
      ON foreign_doctor.doctors (lower(name))
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS foreign_doctor_reg_idx
      ON foreign_doctor.doctors (lower(registration_no))
      WHERE registration_no <> ''
  `;
  migrated = true;
}

function asRow(raw: Record<string, unknown>): ForeignDoctorRow {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    specialty: String(raw.specialty ?? ""),
    council: String(raw.council ?? ""),
    registration_no: String(raw.registration_no ?? ""),
    country: String(raw.country ?? ""),
    image_url: String(raw.image_url ?? ""),
    created_by: raw.created_by ? String(raw.created_by) : null,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

export async function insertForeignDoctor(input: ForeignDoctorInput): Promise<ForeignDoctorRow> {
  const sql = getSql();
  await ensureForeignDoctorsSchema();
  const rows = (await sql`
    INSERT INTO foreign_doctor.doctors (
      name, specialty, council, registration_no, country, image_url, created_by, updated_at
    )
    VALUES (
      ${input.name.trim()},
      ${input.specialty?.trim() || ""},
      ${input.council?.trim() || ""},
      ${input.registrationNo?.trim() || ""},
      ${input.country?.trim() || ""},
      ${input.imageUrl?.trim() || ""},
      ${input.createdBy?.trim() || null},
      now()
    )
    RETURNING id::text, name, specialty, council, registration_no, country, image_url, created_by,
      created_at::text, updated_at::text
  `) as Record<string, unknown>[];
  return asRow(rows[0]);
}

export async function updateForeignDoctor(id: string, input: ForeignDoctorInput): Promise<ForeignDoctorRow | null> {
  const sql = getSql();
  await ensureForeignDoctorsSchema();
  const rows = (await sql`
    UPDATE foreign_doctor.doctors
    SET
      name = ${input.name.trim()},
      specialty = ${input.specialty?.trim() || ""},
      council = ${input.council?.trim() || ""},
      registration_no = ${input.registrationNo?.trim() || ""},
      country = ${input.country?.trim() || ""},
      image_url = ${input.imageUrl?.trim() || ""},
      updated_at = now()
    WHERE id::text = ${id}
    RETURNING id::text, name, specialty, council, registration_no, country, image_url, created_by,
      created_at::text, updated_at::text
  `) as Record<string, unknown>[];
  return rows[0] ? asRow(rows[0]) : null;
}

export async function getForeignDoctor(id: string): Promise<ForeignDoctorRow | null> {
  const sql = getSql();
  await ensureForeignDoctorsSchema();
  const rows = (await sql`
    SELECT id::text, name, specialty, council, registration_no, country, image_url, created_by,
      created_at::text, updated_at::text
    FROM foreign_doctor.doctors
    WHERE id::text = ${id}
    LIMIT 1
  `) as Record<string, unknown>[];
  return rows[0] ? asRow(rows[0]) : null;
}

export async function listForeignDoctors(q?: string): Promise<ForeignDoctorRow[]> {
  const sql = getSql();
  await ensureForeignDoctorsSchema();
  const query = q?.trim().toLowerCase() || "";
  if (!query) {
    return ((await sql`
      SELECT id::text, name, specialty, council, registration_no, country, image_url, created_by,
        created_at::text, updated_at::text
      FROM foreign_doctor.doctors
      ORDER BY updated_at DESC
      LIMIT 80
    `) as Record<string, unknown>[]).map(asRow);
  }
  const like = `%${query}%`;
  return ((await sql`
    SELECT id::text, name, specialty, council, registration_no, country, image_url, created_by,
      created_at::text, updated_at::text
    FROM foreign_doctor.doctors
    WHERE
      lower(name) LIKE ${like}
      OR lower(specialty) LIKE ${like}
      OR lower(council) LIKE ${like}
      OR lower(registration_no) LIKE ${like}
      OR lower(country) LIKE ${like}
    ORDER BY updated_at DESC
    LIMIT 40
  `) as Record<string, unknown>[]).map(asRow);
}
