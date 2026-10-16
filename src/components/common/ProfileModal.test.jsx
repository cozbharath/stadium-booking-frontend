import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProfileModal from "./ProfileModal";

// Mock the api module entirely - these tests check ProfileModal's own logic
// (which tab renders what, role-gating), not the real network layer.
vi.mock("../../services/api", () => ({
    get: vi.fn(),
    put: vi.fn(),
}));

import { get } from "../../services/api";

describe("ProfileModal", () => {
    it("renders nothing when isOpen is false", () => {
        const { container } = render(<ProfileModal isOpen={false} onClose={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("shows only the Profile tab for a non-customer role", async () => {
        get.mockResolvedValueOnce({
            id: 1,
            name: "Admin User",
            email: "admin@example.com",
            role: "ADMIN",
        });

        render(<ProfileModal isOpen={true} onClose={() => {}} />);

        await waitFor(() => expect(screen.getByText("admin@example.com")).toBeInTheDocument());

        // Customer-only tabs must not render for an admin.
        expect(screen.queryByText("Bookings")).not.toBeInTheDocument();
        expect(screen.queryByText("Change Password")).not.toBeInTheDocument();
    });

    it("shows the full tab set for a customer", async () => {
        get.mockResolvedValueOnce({
            id: 2,
            name: "Priya Sharma",
            email: "priya@example.com",
            role: "CUSTOMER",
        });

        render(<ProfileModal isOpen={true} onClose={() => {}} />);

        await waitFor(() => expect(screen.getByText("priya@example.com")).toBeInTheDocument());

        expect(screen.getByText("Bookings")).toBeInTheDocument();
        expect(screen.getByText("History")).toBeInTheDocument();
        expect(screen.getByText("Recent Orders")).toBeInTheDocument();
        expect(screen.getByText("Change Password")).toBeInTheDocument();
    });

    it("calls onClose when the close button is clicked", async () => {
        get.mockResolvedValueOnce({ id: 1, name: "A", email: "a@example.com", role: "CUSTOMER" });
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(<ProfileModal isOpen={true} onClose={onClose} />);
        await waitFor(() => expect(screen.getByText("a@example.com")).toBeInTheDocument());

        await user.click(screen.getByLabelText("Close"));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("shows an error message when the profile fetch fails", async () => {
        get.mockRejectedValueOnce(new Error("Network error"));

        render(<ProfileModal isOpen={true} onClose={() => {}} />);

        await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument());
    });
});
