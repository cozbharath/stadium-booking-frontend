export function formatDate(date) {
    if (!date) return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function shortDate(date) {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(time) {
    if (!time) return "—";
    const parts = String(time).split(":");
    if (parts.length < 2) return String(time);
    let h = Number(parts[0]);
    if (Number.isNaN(h)) return String(time);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${parts[1]} ${suffix}`;
}

/** Normalises the different shapes the backend may return. */
export function normalizeEvent(event) {
    return {
        id: event?.id ?? event?.eventId ?? event?.eventID,
        name: event?.name ?? event?.eventName ?? event?.title ?? "Event",
        stadium: event?.stadiumName ?? event?.stadium?.name ?? (typeof event?.stadium === "string" ? event.stadium : "Stadium"),
        location: event?.stadiumLocation ?? event?.location ?? event?.stadium?.location ?? "",
        date: event?.eventDate ?? event?.date,
        start: event?.startTime ?? event?.time,
        end: event?.endTime,
        status: String(event?.status ?? "UPCOMING"),
        image: event?.imageUrl ?? "",
        category: event?.category ?? event?.eventType ?? event?.type ?? "Live Event"
    };
}

