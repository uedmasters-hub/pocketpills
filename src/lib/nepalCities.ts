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
