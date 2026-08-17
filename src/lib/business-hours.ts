const dayMap: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function isStoreOpenNow(timezone = "America/Fortaleza") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase() ?? "sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  const day = dayMap[weekday.slice(0, 3)] ?? 0;
  const currentMinutes = hour * 60 + minute;

  // Fallback da versão antiga. Quando Supabase estiver ligado, isso será substituído por business_hours.
  const opensAt = 18 * 60;
  const closesAt = 22 * 60;

  return {
    isOpen: day >= 0 && currentMinutes >= opensAt && currentMinutes < closesAt,
    label: "Seg a Dom · 18:00 às 22:00",
  };
}
