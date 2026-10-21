import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../../services/api";
import EventDetailView from "../../components/common/EventDetailView";

function EventDetails() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadEvent = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setEvent(await get(`/events/${eventId}`));
        } catch (err) {
            setError(err?.message || "Failed to load event.");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { queueMicrotask(loadEvent); }, [loadEvent]);

    // guests are sent to login by ProtectedRoute when they open the seat page
    return (
        <EventDetailView
            event={event}
            loading={loading}
            error={error}
            onRetry={loadEvent}
            backTo="/events"
            bookTo={`/customer/seats/${eventId}`}
            bookLabel="Book Tickets"
        />
    );
}

export default EventDetails;
