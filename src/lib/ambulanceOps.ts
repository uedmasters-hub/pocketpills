/**
 * Ambulance fleet + dispatch (demo).
 */

export type VehicleStatus = "available" | "on_run" | "maintenance";

export type FleetVehicle = {
  id: string;
  callSign: string;
  plate: string;
  status: VehicleStatus;
  notes?: string;
};

export type DispatchStatus = "queued" | "assigned" | "en_route" | "completed" | "cancelled";

export type DispatchRun = {
  id: string;
  patientName: string;
  pickup: string;
  dropoff: string;
  priority: "routine" | "urgent";
  status: DispatchStatus;
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  requestedAt: string;
  fee?: number;
};

export type DriverShift = {
  id: string;
  label: string;
  start: string;
  end: string;
  vehicleCallSign: string;
};

function fleetKey(orgId: string) {
  return `pp.ambulance.fleet.${orgId}`;
}
function runsKey(orgId: string) {
  return `pp.ambulance.runs.${orgId}`;
}

function readFleet(orgId: string): FleetVehicle[] {
  try {
    const raw = localStorage.getItem(fleetKey(orgId));
    if (!raw) return seedFleet(orgId);
    const parsed = JSON.parse(raw) as FleetVehicle[];
    return Array.isArray(parsed) ? parsed : seedFleet(orgId);
  } catch {
    return seedFleet(orgId);
  }
}

function writeFleet(orgId: string, list: FleetVehicle[]) {
  localStorage.setItem(fleetKey(orgId), JSON.stringify(list));
}

function seedFleet(orgId: string): FleetVehicle[] {
  const list: FleetVehicle[] = [
    { id: `veh-${orgId}-1`, callSign: "Unit 12", plate: "AMB-112", status: "available" },
    { id: `veh-${orgId}-2`, callSign: "Unit 7", plate: "AMB-207", status: "on_run" },
    { id: `veh-${orgId}-3`, callSign: "Unit 3", plate: "AMB-303", status: "maintenance", notes: "Battery" },
  ];
  writeFleet(orgId, list);
  return list;
}

export function listFleet(orgId: string): FleetVehicle[] {
  return readFleet(orgId);
}

export function saveVehicle(
  orgId: string,
  input: Omit<FleetVehicle, "id"> & { id?: string },
): FleetVehicle {
  const list = readFleet(orgId);
  if (input.id) {
    const next = list.map((v) => (v.id === input.id ? { ...v, ...input, id: input.id } : v));
    writeFleet(orgId, next);
    return next.find((v) => v.id === input.id)!;
  }
  const created: FleetVehicle = {
    id: `veh-${Date.now().toString(36)}`,
    callSign: input.callSign,
    plate: input.plate,
    status: input.status,
    notes: input.notes,
  };
  writeFleet(orgId, [...list, created]);
  return created;
}

function readRuns(orgId: string): DispatchRun[] {
  try {
    const raw = localStorage.getItem(runsKey(orgId));
    if (!raw) return seedRuns(orgId);
    const parsed = JSON.parse(raw) as DispatchRun[];
    return Array.isArray(parsed) ? parsed : seedRuns(orgId);
  } catch {
    return seedRuns(orgId);
  }
}

function writeRuns(orgId: string, list: DispatchRun[]) {
  localStorage.setItem(runsKey(orgId), JSON.stringify(list));
}

function seedRuns(orgId: string): DispatchRun[] {
  const fleet = readFleet(orgId);
  const list: DispatchRun[] = [
    {
      id: `run-${orgId}-1`,
      patientName: "Transfer · Baycrest",
      pickup: "Baycrest Hospital",
      dropoff: "Sunnybrook ER",
      priority: "urgent",
      status: "queued",
      requestedAt: new Date().toISOString(),
      fee: 220,
    },
    {
      id: `run-${orgId}-2`,
      patientName: "Helen Cho",
      pickup: "12 King St W",
      dropoff: "Toronto General",
      priority: "routine",
      status: "assigned",
      vehicleId: fleet[1]?.id,
      driverName: "Alex Chen",
      requestedAt: new Date(Date.now() - 3600000).toISOString(),
      fee: 160,
    },
    {
      id: `run-${orgId}-3`,
      patientName: "Omar Siddiqi",
      pickup: "Union Station",
      dropoff: "St. Michael’s",
      priority: "urgent",
      status: "en_route",
      vehicleId: fleet[1]?.id,
      driverId: "self",
      driverName: "Alex Chen",
      requestedAt: new Date(Date.now() - 7200000).toISOString(),
      fee: 190,
    },
  ];
  writeRuns(orgId, list);
  return list;
}

export function listRuns(orgId: string): DispatchRun[] {
  return readRuns(orgId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function assignRun(
  orgId: string,
  runId: string,
  vehicleId: string,
  driverName: string,
): DispatchRun | null {
  const list = readRuns(orgId);
  const idx = list.findIndex((r) => r.id === runId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    vehicleId,
    driverName,
    driverId: "assigned",
    status: "assigned",
  };
  writeRuns(orgId, list);
  const fleet = readFleet(orgId).map((v) =>
    v.id === vehicleId ? { ...v, status: "on_run" as const } : v,
  );
  writeFleet(orgId, fleet);
  return list[idx];
}

export function updateRunStatus(
  orgId: string,
  runId: string,
  status: DispatchStatus,
): DispatchRun | null {
  const list = readRuns(orgId);
  const idx = list.findIndex((r) => r.id === runId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], status };
  writeRuns(orgId, list);
  if (status === "completed" || status === "cancelled") {
    const vehicleId = list[idx].vehicleId;
    if (vehicleId) {
      writeFleet(
        orgId,
        readFleet(orgId).map((v) =>
          v.id === vehicleId ? { ...v, status: "available" as const } : v,
        ),
      );
    }
  }
  return list[idx];
}

export function runsForDriver(orgId: string, driverDisplayName: string): DispatchRun[] {
  const name = driverDisplayName.trim().toLowerCase();
  return listRuns(orgId).filter(
    (r) =>
      r.status !== "queued" &&
      r.status !== "cancelled" &&
      (r.driverId === "self" || (r.driverName && r.driverName.toLowerCase() === name)),
  );
}

export function driverShifts(_orgId: string): DriverShift[] {
  const today = new Date();
  const fmt = (h: number) => {
    const d = new Date(today);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "shift-1",
      label: "Morning",
      start: fmt(7),
      end: fmt(15),
      vehicleCallSign: "Unit 7",
    },
    {
      id: "shift-2",
      label: "Tomorrow · Day",
      start: new Date(Date.now() + 86400000).toISOString(),
      end: new Date(Date.now() + 86400000 + 8 * 3600000).toISOString(),
      vehicleCallSign: "Unit 12",
    },
  ];
}
