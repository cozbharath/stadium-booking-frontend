import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../../services/api";
import EventDetailView from "../../components/common/EventDetailView";

function CustomerEventDetails() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadEvent = useCallback(async () => {
        if (!eventId) {
            setError("Event ID is missing.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError("");
            setEvent(await get(`/events/${eventId}`));
        } catch (err) {
            setError(err?.message || "Failed to load event details.");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { queueMicrotask(loadEvent); }, [loadEvent]);

    return (
        <EventDetailView
            event={event}
            loading={loading}
            error={error}
            onRetry={loadEvent}
            backTo="/customer/events"
            bookTo={`/customer/seats/${eventId}`}
        />
    );
}

export default CustomerEventDetails;
