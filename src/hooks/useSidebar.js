import { useCallback, useEffect, useState } from "react";

const KEY = "yt-sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 900px)";

/**
 * Sidebar state shared by every layout.
 *  - desktop: `collapsed` toggles between full and icon-only width (remembered)
 *  - mobile : `mobileOpen` toggles an off-canvas drawer
 */
export default function useSidebar() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    const isMobile = () =>
        typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

    const toggle = useCallback(() => {
        if (isMobile()) {
            setMobileOpen((v) => !v);
            return;
        }
        setCollapsed((v) => {
            const next = !v;
            try { localStorage.setItem(KEY, next ? "1" : "0"); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const close = useCallback(() => setMobileOpen(false), []);

    // Esc closes the drawer, and the drawer never stays open after resizing to desktop
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
        const mq = window.matchMedia(MOBILE_QUERY);
        const onChange = () => !mq.matches && setMobileOpen(false);
        window.addEventListener("keydown", onKey);
        mq.addEventListener("change", onChange);
        return () => {
            window.removeEventListener("keydown", onKey);
            mq.removeEventListener("change", onChange);
        };
    }, []);

    // lock page scroll while the drawer is open
    useEffect(() => {
        document.body.classList.toggle("yt-no-scroll", mobileOpen);
        return () => document.body.classList.remove("yt-no-scroll");
    }, [mobileOpen]);

    return { collapsed, mobileOpen, toggle, close };
}
