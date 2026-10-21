import { useEffect } from "react";

/** Adds `.in` to every `.bn-reveal` element when it scrolls into view. */
export default function useReveal(deps = []) {
    useEffect(() => {
        const els = document.querySelectorAll(".bn-reveal:not(.in)");
        if (!("IntersectionObserver" in window)) {
            els.forEach((el) => el.classList.add("in"));
            return;
        }
        const io = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("in");
                        io.unobserve(e.target);
                    }
                }),
            { threshold: 0.12 }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
