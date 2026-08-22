-- Dedicated foreign-doctor registry (FOREIGN_DOCTORS_DATABASE_URL, else DATABASE_URL).
CREATE SCHEMA IF NOT EXISTS foreign_doctor;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
);
