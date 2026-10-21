import EventsListing from "../../components/common/EventsListing";

function CustomerEvents() {
    return (
        <EventsListing
            base="/customer/events"
            title="Explore Events"
            subtitle="Book your next stadium experience."
        />
    );
}

export default CustomerEvents;
