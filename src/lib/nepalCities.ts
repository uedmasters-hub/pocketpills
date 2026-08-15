const CITY_KEY = "pp.doctors.city.v1";

export const DEFAULT_DOCTOR_CITY = "Kathmandu";

export const NEPAL_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Biratnagar",
  "Birgunj",
  "Dharan",
  "Itahari",
  "Nepalgunj",
  "Butwal",
  "Bharatpur",
  "Hetauda",
  "Janakpur",
  "Dhangadhi",
] as const;

const NEARBY: Record<string, string[]> = {
  Kathmandu: ["Lalitpur", "Bhaktapur", "Hetauda", "Pokhara", "Bharatpur"],
  Lalitpur: ["Kathmandu", "Bhaktapur", "Hetauda", "Pokhara", "Bharatpur"],
  Bhaktapur: ["Kathmandu", "Lalitpur", "Hetauda", "Pokhara", "Banepa"],
  Pokhara: ["Kathmandu", "Lalitpur", "Bharatpur", "Butwal", "Hetauda"],
  Biratnagar: ["Dharan", "Itahari", "Damak", "Rajbiraj", "Janakpur"],
  Birgunj: ["Hetauda", "Bharatpur", "Janakpur", "Kalaiya", "Kathmandu"],
  Dharan: ["Itahari", "Biratnagar", "Dhankuta", "Damak", "Inaruwa"],
  Itahari: ["Dharan", "Biratnagar", "Inaruwa", "Damak", "Duhabi"],
  Nepalgunj: ["Kohalpur", "Gulariya", "Tulsipur", "Ghorahi", "Surkhet"],
  Butwal: ["Bhairahawa", "Palpa", "Bharatpur", "Pokhara", "Nepalgunj"],
  Bharatpur: ["Hetauda", "Kathmandu", "Butwal", "Birgunj", "Pokhara"],
  Hetauda: ["Kathmandu", "Lalitpur", "Bharatpur", "Birgunj", "Bhaktapur"],
  Janakpur: ["Birgunj", "Rajbiraj", "Bardibas", "Malangwa", "Biratnagar"],
  Dhangadhi: ["Mahendranagar", "Tikapur", "Nepalgunj", "Surkhet", "Dadeldhura"],
};

const FALLBACK_NEARBY = ["Kathmandu", "Lalitpur", "Pokhara", "Biratnagar", "Bharatpur"];

export function normalizeCityName(raw: string) {
  return String(raw || "").replace(/\s+/g, " ").trim();
}

export function readSavedDoctorCity() {
  try {
    const saved = normalizeCityName(localStorage.getItem(CITY_KEY) || "");
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_DOCTOR_CITY;
}

export function saveDoctorCity(city: string) {
  const next = normalizeCityName(city) || DEFAULT_DOCTOR_CITY;
  try {
    localStorage.setItem(CITY_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

export function nearbyCities(city: string, count = 5): string[] {
  const current = normalizeCityName(city);
  const key =
    Object.keys(NEARBY).find((c) => c.toLowerCase() === current.toLowerCase()) || current;
  const listed = NEARBY[key] || FALLBACK_NEARBY;
  const out: string[] = [];
  for (const name of listed) {
    if (name.toLowerCase() === current.toLowerCase()) continue;
    out.push(name);
    if (out.length >= count) break;
  }
  if (out.length < count) {
    for (const name of FALLBACK_NEARBY) {
      if (name.toLowerCase() === current.toLowerCase()) continue;
      if (out.some((c) => c.toLowerCase() === name.toLowerCase())) continue;
      out.push(name);
      if (out.length >= count) break;
    }
  }
  return out.slice(0, count);
}

export function citySelectOptions(current: string): string[] {
  const cur = normalizeCityName(current) || DEFAULT_DOCTOR_CITY;
  const names: string[] = [...NEPAL_CITIES];
  if (!names.some((c) => c.toLowerCase() === cur.toLowerCase())) names.unshift(cur);
  return [...new Set(names)];
}

const DISTRICT_KEY = "pp.pharmacies.district.v1";

export const DEFAULT_PHARMACY_DISTRICT = "Kathmandu";

export const NEPAL_DISTRICTS = [
  "Kathmandu",
  "Morang",
  "Rupandehi",
  "Lalitpur",
  "Jhapa",
  "Chitwan",
  "Kaski",
  "Kailali",
  "Sunsari",
  "Banke",
  "Dhanusha",
  "Parsa",
  "Dang",
  "Bhaktapur",
  "Makwanpur",
] as const;

/** Top DDA districts — footer / coverage pills (mirrors former CA province chips). */
export const FEATURED_DELIVERY_DISTRICTS = NEPAL_DISTRICTS.slice(0, 13);

export function districtSlug(name: string) {
  return normalizeCityName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function districtFromSlug(slug: string, districts: string[]) {
  const key = districtSlug(slug);
  return districts.find((d) => districtSlug(d) === key) || null;
}

export function pharmacyDirectoryPath(district: string) {
  return `/pharmacies?district=${encodeURIComponent(normalizeCityName(district))}`;
}

const NEARBY_DISTRICTS: Record<string, string[]> = {
  Kathmandu: ["Lalitpur", "Bhaktapur", "Kavrepalanchok", "Makwanpur", "Chitwan"],
  Lalitpur: ["Kathmandu", "Bhaktapur", "Makwanpur", "Kavrepalanchok", "Chitwan"],
  Bhaktapur: ["Kathmandu", "Lalitpur", "Kavrepalanchok", "Makwanpur", "Chitwan"],
  Kaski: ["Tanahu", "Syangja", "Parbat", "Lamjung", "Kathmandu"],
  Morang: ["Sunsari", "Jhapa", "Dhankuta", "Saptari", "Kathmandu"],
  Rupandehi: ["Nawalparasi", "Kapilvastu", "Palpa", "Chitwan", "Kathmandu"],
  Chitwan: ["Makwanpur", "Nawalparasi", "Dhading", "Kathmandu", "Lalitpur"],
  Jhapa: ["Morang", "Ilam", "Sunsari", "Panchthar", "Kathmandu"],
  Kailali: ["Kanchanpur", "Bardiya", "Doti", "Surkhet", "Kathmandu"],
  Parsa: ["Bara", "Rautahat", "Makwanpur", "Chitwan", "Kathmandu"],
};

const FALLBACK_NEARBY_DISTRICTS = ["Kathmandu", "Lalitpur", "Kaski", "Morang", "Chitwan"];

export function readSavedPharmacyDistrict() {
  try {
    const saved = normalizeCityName(localStorage.getItem(DISTRICT_KEY) || "");
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_PHARMACY_DISTRICT;
}

export function savePharmacyDistrict(district: string) {
  const next = normalizeCityName(district) || DEFAULT_PHARMACY_DISTRICT;
  try {
    localStorage.setItem(DISTRICT_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

export function nearbyDistricts(district: string, count = 5): string[] {
  const current = normalizeCityName(district);
  const key =
    Object.keys(NEARBY_DISTRICTS).find((c) => c.toLowerCase() === current.toLowerCase()) || current;
  const listed = NEARBY_DISTRICTS[key] || FALLBACK_NEARBY_DISTRICTS;
  const out: string[] = [];
  for (const name of listed) {
    if (name.toLowerCase() === current.toLowerCase()) continue;
    out.push(name);
    if (out.length >= count) break;
  }
  if (out.length < count) {
    for (const name of FALLBACK_NEARBY_DISTRICTS) {
      if (name.toLowerCase() === current.toLowerCase()) continue;
      if (out.some((c) => c.toLowerCase() === name.toLowerCase())) continue;
      out.push(name);
      if (out.length >= count) break;
    }
  }
  return out.slice(0, count);
}

export function districtSelectOptions(current: string, extra: string[] = []): string[] {
  const cur = normalizeCityName(current) || DEFAULT_PHARMACY_DISTRICT;
  const names: string[] = [cur, ...NEPAL_DISTRICTS, ...extra.map(normalizeCityName).filter(Boolean)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}
