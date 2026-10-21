import { Link } from "react-router-dom";
import { formatTime, normalizeEvent, shortDate } from "./eventUtils";

/** BookMyShow-style poster card. `base` = "/events" (public) or "/customer/events". */
export default function EventCard({ event, base = "/events" }) {
    const e = normalizeEvent(event);

    return (
        <Link to={`${base}/${e.id}`} className="bn-card">
            <div className="bn-poster">
                {e.image ? (
                    <img
                        src={e.image}
                        alt={e.name}
                        loading="lazy"
                        onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                    />
                ) : (
                    <div className="bn-poster-fallback">🏟️</div>
                )}
                <span className="bn-poster-badge">{e.status}</span>
                <div className="bn-poster-foot">
                    <span>{shortDate(e.date)}</span>
                    <span>{formatTime(e.start)}</span>
                </div>
            </div>
            <h3>{e.name}</h3>
            <p className="meta">{e.stadium}{e.location ? ` • ${e.location}` : ""}</p>
        </Link>
    );
}

export function EventSkeletons({ count = 6 }) {
    return Array.from({ length: count }, (_, i) => (
        <div key={i}>
            <div className="bn-skel poster" />
            <div className="bn-skel" style={{ height: 14, marginTop: 12, width: "80%" }} />
            <div className="bn-skel" style={{ height: 12, marginTop: 8, width: "55%" }} />
        </div>
    ));
}
