import { Routes, Route } from "react-router-dom";

// ============================================================
// PUBLIC
// ============================================================

import PublicLayout from "../layouts/PublicLayout";

import Home from "../pages/public/Home";
import Events from "../pages/public/Events";
import EventDetails from "../pages/public/EventDetails";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";

// ============================================================
// PROTECTED ROUTE
// ============================================================

import ProtectedRoute from "./ProtectedRoute";

// ============================================================
// ADMIN
// ============================================================

import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import CreateStaff from "../pages/admin/CreateStaff";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageStadiums from "../pages/admin/ManageStadiums";
import ManageStandTypes from "../pages/admin/ManageStandTypes";
import ManageStands from "../pages/admin/ManageStands";
import ManageSeats from "../pages/admin/ManageSeats";
import ManageEvents from "../pages/admin/ManageEvents";
import ManageEventSeats from "../pages/admin/ManageEventSeats";

// ============================================================
// CUSTOMER
// ============================================================

import CustomerLayout from "../layouts/CustomerLayout";

import CustomerDashboard from "../pages/customer/CustomerDashboard";

// CUSTOMER EVENT PAGES
import CustomerEvents from "../pages/customer/CustomerEvents";
import CustomerEventDetails from "../pages/customer/CustomerEventDetails";

import SeatSelection from "../pages/customer/SeatSelection";
import Booking from "../pages/customer/Booking";
import Payment from "../pages/customer/Payment";
import MyBookings from "../pages/customer/MyBookings";
import BookingDetails from "../pages/customer/BookingDetails";
import MyTickets from "../pages/customer/MyTickets";


// ============================================================
// STAFF
// ============================================================

import StaffLayout from "../layouts/StaffLayout";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffBookings from "../pages/staff/StaffBookings";
import StaffEvents from "../pages/staff/StaffEvents";
import TicketValidation from "../pages/staff/TicketValidation";

// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {

    return (

        <Routes>

            {/* ====================================================
                PUBLIC ROUTES
            ==================================================== */}

            <Route element={<PublicLayout />}>

                {/* HOME */}

                <Route
                    path="/"
                    element={<Home />}
                />

                {/* PUBLIC EVENTS */}

                <Route
                    path="/events"
                    element={<Events />}
                />

                {/* PUBLIC EVENT DETAILS */}

                <Route
                    path="/events/:eventId"
                    element={<EventDetails />}
                />

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* REGISTER */}

                <Route
                    path="/register"
                    element={<Register />}
                />

            </Route>


            {/* ====================================================
                ADMIN ROUTES
            ==================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["ADMIN"]}
                    />
                }
            >

                <Route element={<AdminLayout />}>

                    {/* ADMIN DASHBOARD */}

                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />

                    {/* CREATE STAFF */}

                    <Route
                        path="/admin/staff/create"
                        element={<CreateStaff />}
                    />

                    {/* USERS */}

                    <Route
                        path="/admin/users"
                        element={<ManageUsers />}
                    />

                    {/* STADIUMS */}

                    <Route
                        path="/admin/stadiums"
                        element={<ManageStadiums />}
                    />

                    {/* STAND TYPES */}

                    <Route
                        path="/admin/stand-types"
                        element={<ManageStandTypes />}
                    />

                    {/* STANDS */}

                    <Route
                        path="/admin/stands"
                        element={<ManageStands />}
                    />

                    {/* SEATS */}

                    <Route
                        path="/admin/seats"
                        element={<ManageSeats />}
                    />

                    {/* EVENTS */}

                    <Route
                        path="/admin/events"
                        element={<ManageEvents />}
                    />

                    {/* EVENT SEATS */}

                    <Route
                        path="/admin/event-seats"
                        element={<ManageEventSeats />}
                    />

                </Route>

            </Route>


            {/* ====================================================
                STAFF ROUTES
            ==================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["STAFF"]}
                    />
                }
            >

                <Route element={<StaffLayout />}>

                    {/* STAFF DASHBOARD */}

                    <Route
                        path="/staff/dashboard"
                        element={<StaffDashboard />}
                    />

                    {/* STAFF BOOKINGS */}

                    <Route
                        path="/staff/bookings"
                        element={<StaffBookings />}
                    />

                    {/* STAFF EVENTS */}

                    <Route
                        path="/staff/events"
                        element={<StaffEvents />}
                    />

                    {/* TICKET VALIDATION */}

                    <Route
                        path="/staff/tickets/validate"
                        element={<TicketValidation />}
                    />

                </Route>

            </Route>


            {/* ====================================================
                CUSTOMER ROUTES
            ==================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["CUSTOMER"]}
                    />
                }
            >

                <Route element={<CustomerLayout />}>

                    {/* ====================================================
                        CUSTOMER DASHBOARD
                    ==================================================== */}

                    <Route
                        path="/customer/dashboard"
                        element={<CustomerDashboard />}
                    />


                    {/* ====================================================
                        CUSTOMER EVENTS
                    ==================================================== */}

                    <Route
                        path="/customer/events"
                        element={<CustomerEvents />}
                    />


                    {/* ====================================================
                        CUSTOMER EVENT DETAILS
                    ==================================================== */}

                    <Route
                        path="/customer/events/:eventId"
                        element={<CustomerEventDetails />}
                    />


                    {/* ====================================================
                        SEAT SELECTION
                    ==================================================== */}

                    <Route
                        path="/customer/seats/:eventId"
                        element={<SeatSelection />}
                    />


                    {/* ====================================================
                        BOOKING
                    ==================================================== */}

                    <Route
                        path="/customer/booking"
                        element={<Booking />}
                    />


                    {/* ====================================================
                        PAYMENT
                    ==================================================== */}

                    <Route
                        path="/customer/payment"
                        element={<Payment />}
                    />


                    {/* ====================================================
                        MY BOOKINGS
                    ==================================================== */}

                    <Route
                        path="/customer/bookings"
                        element={<MyBookings />}
                    />


                    {/* ====================================================
                        BOOKING DETAILS
                    ==================================================== */}

                    <Route
                        path="/customer/bookings/:bookingId"
                        element={<BookingDetails />}
                    />


                    {/* ====================================================
                        MY TICKETS
                    ==================================================== */}

                    <Route
                        path="/customer/tickets"
                        element={<MyTickets />}
                    />

                </Route>

            </Route>


            {/* ====================================================
                FALLBACK
            ==================================================== */}

            <Route
                path="*"
                element={<Login />}
            />

        </Routes>

    );
}

export default AppRoutes;