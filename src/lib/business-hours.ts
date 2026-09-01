import type { SupabaseClient } from "@supabase/supabase-js";

export type BusinessHourRow = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type StoreStatus = {
  isOpen: boolean;
  label: string;
  message: string;
};

const WEEKDAY_SHORT_TO_NUMBER: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const WEEKDAY_LABELS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const FALLBACK_HOURS: BusinessHourRow[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  opens_at: "18:00:00",
  closes_at: "22:00:00",
  is_closed: false,
}));

function parseTimeToMinutes(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

function getZonedNow(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekdayKey =
    parts.find((part) => part.type === "weekday")?.value.toLowerCase().slice(0, 3) ??
    "sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return {
    weekday: WEEKDAY_SHORT_TO_NUMBER[weekdayKey] ?? 0,
    minutes: hour * 60 + minute,
  };
}

function isValidOpenDay(hour: BusinessHourRow | undefined) {
  return Boolean(
    hour && !hour.is_closed && hour.opens_at && hour.closes_at,
  );
}

function getScheduleLabel(hours: BusinessHourRow[], weekday: number) {
  const today = hours.find((item) => item.weekday === weekday);
  if (!isValidOpenDay(today)) return "Fechado hoje";
  return `Hoje · ${formatTime(today!.opens_at)} às ${formatTime(today!.closes_at)}`;
}

function getNextOpeningMessage(
  hours: BusinessHourRow[],
  weekday: number,
  currentMinutes: number,
) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const targetWeekday = (weekday + offset) % 7;
    const target = hours.find((item) => item.weekday === targetWeekday);
    if (!isValidOpenDay(target)) continue;

    const opensAt = parseTimeToMinutes(target!.opens_at);
    if (opensAt === null) continue;

    if (offset === 0 && currentMinutes < opensAt) {
      return `Estamos fechados no momento. Abrimos hoje às ${formatTime(target!.opens_at)}`;
    }

    if (offset === 0) continue;

    if (offset === 1) {
      return `Estamos fechados no momento. Abrimos amanhã às ${formatTime(target!.opens_at)}`;
    }

    return `Estamos fechados no momento. Abrimos ${WEEKDAY_LABELS[targetWeekday]} às ${formatTime(target!.opens_at)}`;
  }

  return "Estamos fechados no momento. Consulte o horário de funcionamento.";
}

export function evaluateBusinessHours(
  hours: BusinessHourRow[],
  timezone = "America/Fortaleza",
  now = new Date(),
): StoreStatus {
  const { weekday, minutes } = getZonedNow(timezone, now);
  const today = hours.find((item) => item.weekday === weekday);
  const previousWeekday = (weekday + 6) % 7;
  const previous = hours.find((item) => item.weekday === previousWeekday);

  // Se o expediente do dia anterior atravessa a meia-noite (ex.: 18:00–02:00),
  // ainda podemos estar dentro dele no início do dia atual.
  if (isValidOpenDay(previous)) {
    const previousOpen = parseTimeToMinutes(previous!.opens_at);
    const previousClose = parseTimeToMinutes(previous!.closes_at);
    if (
      previousOpen !== null &&
      previousClose !== null &&
      previousClose <= previousOpen &&
      minutes < previousClose
    ) {
      return {
        isOpen: true,
        label: `Aberto agora · até ${formatTime(previous!.closes_at)}`,
        message: `Estamos aceitando pedidos até ${formatTime(previous!.closes_at)}`,
      };
    }
  }

  if (isValidOpenDay(today)) {
    const opensAt = parseTimeToMinutes(today!.opens_at);
    const closesAt = parseTimeToMinutes(today!.closes_at);

    if (opensAt !== null && closesAt !== null) {
      const crossesMidnight = closesAt <= opensAt;
      const openNow = crossesMidnight
        ? minutes >= opensAt
        : minutes >= opensAt && minutes < closesAt;

      if (openNow) {
        return {
          isOpen: true,
          label: `Aberto agora · até ${formatTime(today!.closes_at)}`,
          message: `Estamos aceitando pedidos até ${formatTime(today!.closes_at)}`,
        };
      }
    }
  }

  return {
    isOpen: false,
    label: getScheduleLabel(hours, weekday),
    message: getNextOpeningMessage(hours, weekday, minutes),
  };
}

export function getFallbackStoreStatus(timezone = "America/Fortaleza") {
  return evaluateBusinessHours(FALLBACK_HOURS, timezone);
}

export async function getBusinessStoreStatus(
  supabase: SupabaseClient,
  businessId: string,
  timezone = "America/Fortaleza",
) {
  const { data, error } = await supabase
    .from("business_hours")
    .select("weekday,opens_at,closes_at,is_closed")
    .eq("business_id", businessId)
    .order("weekday");

  if (error) {
    throw new Error(`Não foi possível consultar o horário da loja: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error("O horário de funcionamento da loja ainda não foi configurado.");
  }

  return evaluateBusinessHours(data as BusinessHourRow[], timezone);
}
