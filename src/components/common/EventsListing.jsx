import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { get } from "../../services/api";
import EventCard, { EventSkeletons } from "./EventCard";
import { normalizeEvent } from "./eventUtils";
import useReveal from "../../hooks/useReveal";

const FILTERS = ["All", "Cricket", "Football", "Concert", "Kabaddi", "Esports"];
const WHEN = [
    { id: "all", label: "Any date" },
    { id: "today", label: "Today" },
    { id: "week", label: "This week" },
    { id: "month", label: "This month" }
];

function inRange(date, when) {
    if (when === "all") return true;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return false;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const days = when === "today" ? 1 : when === "week" ? 7 : 31;
    const end = new Date(start); end.setDate(end.getDate() + days);
    return d >= start && d < end;
}

/** Shared by /events (guests) and /customer/events (logged in). */
export default function EventsListing({ base, title = "Events in Hyderabad", subtitle = "Pick a match, concert or live show." }) {
    const [params, setParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [when, setWhen] = useState("all");

    const q = params.get("q") || "";

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await get("/events");
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || "Failed to load events.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { queueMicrotask(load); }, [load]);

    const setQuery = (value) => {
        const next = new URLSearchParams(params);
        value ? next.set("q", value) : next.delete("q");
        setParams(next, { replace: true });
    };

    const list = useMemo(() => {
        const term = q.trim().toLowerCase();
        return events.filter((ev) => {
            const e = normalizeEvent(ev);
            const hay = `${e.name} ${e.stadium} ${e.location} ${e.category}`.toLowerCase();
            return (!term || hay.includes(term)) && inRange(e.date, when);
        });
    }, [events, q, when]);

    useReveal([list.length, loading]);

    return (
        <div className="bn-wrap" style={{ paddingBottom: 30 }}>
            <div className="bn-page-title">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>

            <div className="bn-toolbar">
                <label className="bn-search">
                    <span aria-hidden="true">🔍</span>
                    <input value={q} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…" aria-label="Search events" />
                </label>
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        type="button"
                        className={`bn-chip ${(f === "All" ? !q : q.toLowerCase() === f.toLowerCase()) ? "active" : ""}`}
                        onClick={() => setQuery(f === "All" ? "" : f)}
                    >
                        {f}
                    </button>
                ))}
                <span style={{ width: 1, alignSelf: "stretch", background: "var(--yt-line)" }} />
                {WHEN.map((w) => (
                    <button key={w.id} type="button" className={`bn-chip ${when === w.id ? "active" : ""}`} onClick={() => setWhen(w.id)}>
                        {w.label}
                    </button>
                ))}
            </div>

            {loading && <div className="bn-grid" style={{ marginTop: 14 }}><EventSkeletons count={8} /></div>}

            {!loading && error && (
                <div className="bn-state" style={{ marginTop: 14 }}>
                    <div className="ico">⚠️</div>
                    <h3>Unable to load events</h3>
                    <p>{error}</p>
                    <button type="button" className="bn-btn bn-btn-primary" onClick={load}>Try Again</button>
                </div>
            )}

            {!loading && !error && list.length === 0 && (
                <div className="bn-state" style={{ marginTop: 14 }}>
                    <div className="ico">🎟️</div>
                    <h3>No events found</h3>
                    <p>Try a different search or date filter.</p>
                    <button type="button" className="bn-btn bn-btn-ghost" onClick={() => { setQuery(""); setWhen("all"); }}>Clear filters</button>
                </div>
            )}

            {!loading && !error && list.length > 0 && (
                <>
                    <p style={{ margin: "6px 0 14px", fontSize: 13, color: "var(--yt-muted)" }}>
                        {list.length} {list.length === 1 ? "event" : "events"} found
                    </p>
                    <div className="bn-grid">
                        {list.map((ev, i) => (
                            <div key={normalizeEvent(ev).id ?? i} className="bn-reveal" style={{ transitionDelay: `${Math.min(i % 8, 7) * 40}ms` }}>
                                <EventCard event={ev} base={base} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
