# YourTurn frontend (your original pages, adapted for the microservices backend)

Run:

    npm install
    npm run dev          # http://localhost:5173  (the gateway allows this origin for CORS)

Backend: the API gateway must be running on http://localhost:8888 (same address as before).

What changed from your original copy:

* src/pages/customer/SeatSelection.jsx
    - also calls GET /api/seat-holds/event/{id}/unavailable (booking-service) and marks those seats as booked
    - when a hold fails (for example 409 seat already taken) it clears the selection, reloads the seat map, then shows the message

Everything else is unchanged: every endpoint your pages call (/auth, /users, /events, /event-seats,
/stadiums, /stands, /stand-types, /seats, /seat-holds, /bookings, /payments, /tickets, /support) exists on the
gateway with the same path, method and response fields.
