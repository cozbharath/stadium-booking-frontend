import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CX,
    CY,
    MAX_W,
    MIN_W,
    STAND_PHOTOS,
    VIEW_RATIO,
    VIEW_H,
    VIEW_W,
    cameraFor,
    layoutStands,
    standKey,
    viewArtSvg
} from "./stadiumLayout";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function clampView(v) {
    const h = v.w * VIEW_RATIO;
    const minX = Math.min(v.w / 2, CX);
    const maxX = Math.max(VIEW_W - v.w / 2, CX);
    const minY = Math.min(h / 2, CY);
    const maxY = Math.max(VIEW_H - h / 2, CY);

    return {
        w: clamp(v.w, MIN_W, MAX_W),
        cx: clamp(v.cx, minX, maxX),
        cy: clamp(v.cy, minY, maxY)
    };
}

function priceText(stand) {
    return stand.minPrice === stand.maxPrice
        ? money(stand.minPrice)
        : `${money(stand.minPrice)} – ${money(stand.maxPrice)}`;
}

/*
 * The stadium: two rings around the ground. Tap a stand and the camera
 * flies in so you can see and tap its seats. Scroll / pinch to zoom,
 * drag to move around.
 *
 * Props
 *   stands        stands from SeatSelection (name, color, seats, prices ...)
 *   rowsByStand   { [standName]: [[rowName, seats[]], ...] }
 *   activeName    the stand that is open (or null for the whole stadium)
 *   onActiveChange(name | null)
 *   selectedIds   array of selected event-seat ids
 *   onSeatClick(seat)
 *   holding       true while the seat hold request is running
 */
function StadiumMap({
    stands,
    rowsByStand,
    activeName,
    onActiveChange,
    selectedIds,
    onSeatClick,
    holding,
    canChangeStand = true
}) {
    const svgRef = useRef(null);
    const boxRef = useRef(null);
    const tipRef = useRef(null);
    const viewRef = useRef({ cx: CX, cy: CY, w: MAX_W });
    const tweenRef = useRef(null);
    const suppressClick = useRef(false);
    const firstFly = useRef(true);
    const [message, setMessage] = useState("");

    const layout = useMemo(() => layoutStands(stands, rowsByStand), [stands, rowsByStand]);
    const activeBlock = activeName ? layout.byName[activeName] : null;
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const standByName = useMemo(() => {
        const m = {};
        stands.forEach((s) => { m[s.name] = s; });
        return m;
    }, [stands]);

    // ------------------------------------------------------------
    // camera
    // ------------------------------------------------------------

    const applyView = useCallback(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const v = viewRef.current;
        const h = v.w * VIEW_RATIO;

        svg.setAttribute(
            "viewBox",
            `${(v.cx - v.w / 2).toFixed(1)} ${(v.cy - h / 2).toFixed(1)} ${v.w.toFixed(1)} ${h.toFixed(1)}`
        );
    }, []);

    const stopTween = useCallback(() => {
        if (tweenRef.current) {
            cancelAnimationFrame(tweenRef.current);
            tweenRef.current = null;
        }
    }, []);

    const flyTo = useCallback((target, ms) => {
        stopTween();
        const to = clampView(target);
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduce || !ms) {
            viewRef.current = to;
            applyView();
            return;
        }

        const from = { ...viewRef.current };
        const t0 = performance.now();

        const frame = (now) => {
            const k = Math.min(1, (now - t0) / ms);
            const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

            viewRef.current = {
                cx: from.cx + (to.cx - from.cx) * e,
                cy: from.cy + (to.cy - from.cy) * e,
                w: from.w + (to.w - from.w) * e
            };
            applyView();

            tweenRef.current = k < 1 ? requestAnimationFrame(frame) : null;
        };

        tweenRef.current = requestAnimationFrame(frame);
    }, [applyView, stopTween]);

    // screen position -> map position
    const toMap = useCallback((clientX, clientY) => {
        const r = svgRef.current.getBoundingClientRect();
        const v = viewRef.current;
        const h = v.w * VIEW_RATIO;
        const s = Math.min(r.width / v.w, r.height / h) || 1;
        const ox = r.left + (r.width - v.w * s) / 2;
        const oy = r.top + (r.height - h * s) / 2;

        return {
            x: v.cx - v.w / 2 + (clientX - ox) / s,
            y: v.cy - h / 2 + (clientY - oy) / s,
            s
        };
    }, []);

    const zoomAround = useCallback((px, py, factor) => {
        const v = viewRef.current;
        const nw = clamp(v.w * factor, MIN_W, MAX_W);
        const k = nw / v.w;

        viewRef.current = clampView({
            cx: px - (px - v.cx) * k,
            cy: py - (py - v.cy) * k,
            w: nw
        });
        applyView();
    }, [applyView]);

    // fly to the open stand (or back to the whole stadium)
    useEffect(() => {
        const width = boxRef.current ? boxRef.current.clientWidth : 800;
        const target = activeBlock
            ? cameraFor(activeBlock, width)
            : { cx: CX, cy: CY, w: MAX_W };

        flyTo(target, firstFly.current ? 0 : 560);
        firstFly.current = false;
    }, [activeBlock, flyTo]);

    useEffect(() => () => stopTween(), [stopTween]);

    // ------------------------------------------------------------
    // tooltip (plain DOM, so moving the mouse never re-renders the map)
    // ------------------------------------------------------------

    const hideTip = useCallback(() => {
        if (tipRef.current) tipRef.current.hidden = true;
    }, []);

    const showTip = useCallback((e) => {
        const tip = tipRef.current;
        const box = boxRef.current;
        if (!tip || !box) return;

        const el = e.target.closest && e.target.closest("[data-tip]");
        if (!el) { tip.hidden = true; return; }

        tip.textContent = "";
        const strong = document.createElement("b");
        strong.textContent = el.getAttribute("data-tip");
        tip.appendChild(strong);

        const sub = el.getAttribute("data-tip2");
        if (sub) {
            const span = document.createElement("span");
            span.textContent = sub;
            tip.appendChild(span);
        }

        tip.hidden = false;
        const r = box.getBoundingClientRect();
        let x = e.clientX - r.left;
        const y = e.clientY - r.top;
        if (x > r.width - 190) x -= 190;
        tip.style.left = `${x}px`;
        tip.style.top = `${y}px`;
    }, []);

    // ------------------------------------------------------------
    // wheel, drag and pinch
    // ------------------------------------------------------------

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return undefined;

        const pointers = new Map();
        let pan = null;
        let pinch = null;

        const onWheel = (e) => {
            e.preventDefault();
            stopTween();
            const p = toMap(e.clientX, e.clientY);
            zoomAround(p.x, p.y, Math.exp(e.deltaY * 0.0016));
        };

        const onDown = (e) => {
            stopTween();
            suppressClick.current = false;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (pointers.size === 1) {
                pan = {
                    x: e.clientX,
                    y: e.clientY,
                    cx: viewRef.current.cx,
                    cy: viewRef.current.cy,
                    s: toMap(e.clientX, e.clientY).s,
                    moved: false
                };
            }

            if (pointers.size === 2) {
                const a = Array.from(pointers.values());
                pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) };
                pan = null;
                suppressClick.current = true;
            }
        };

        const onMove = (e) => {
            if (pointers.has(e.pointerId)) {
                pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }

            if (pinch && pointers.size === 2) {
                const a = Array.from(pointers.values());
                const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
                const m = toMap((a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2);

                if (pinch.d > 0 && d > 0) zoomAround(m.x, m.y, pinch.d / d);
                pinch.d = d;
                return;
            }

            if (pan && pointers.size === 1) {
                const dx = e.clientX - pan.x;
                const dy = e.clientY - pan.y;

                if (!pan.moved && Math.hypot(dx, dy) > 6) {
                    pan.moved = true;
                    suppressClick.current = true;
                    hideTip();
                    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
                    svg.classList.add("dragging");
                }

                if (pan.moved) {
                    viewRef.current = clampView({
                        w: viewRef.current.w,
                        cx: pan.cx - dx / pan.s,
                        cy: pan.cy - dy / pan.s
                    });
                    applyView();
                    return;
                }
            }

            if (e.pointerType === "mouse") showTip(e);
        };

        const onEnd = (e) => {
            pointers.delete(e.pointerId);
            if (pointers.size < 2) pinch = null;
            if (pointers.size === 0) {
                pan = null;
                svg.classList.remove("dragging");
            }
        };

        const onLeave = (e) => {
            if (e.pointerType === "mouse") hideTip();
        };

        svg.addEventListener("wheel", onWheel, { passive: false });
        svg.addEventListener("pointerdown", onDown);
        svg.addEventListener("pointermove", onMove);
        svg.addEventListener("pointerup", onEnd);
        svg.addEventListener("pointercancel", onEnd);
        svg.addEventListener("pointerleave", onLeave);

        return () => {
            svg.removeEventListener("wheel", onWheel);
            svg.removeEventListener("pointerdown", onDown);
            svg.removeEventListener("pointermove", onMove);
            svg.removeEventListener("pointerup", onEnd);
            svg.removeEventListener("pointercancel", onEnd);
            svg.removeEventListener("pointerleave", onLeave);
        };
    }, [applyView, hideTip, showTip, stopTween, toMap, zoomAround]);

    // ------------------------------------------------------------
    // taps
    // ------------------------------------------------------------

    const openStand = (name) => {
        const stand = standByName[name];

        if (!stand) return;

        if (stand.availableCount === 0) {
            setMessage(`${name} is sold out. Please pick another stand.`);
            return;
        }

        setMessage("");
        hideTip();
        onActiveChange(name);
    };

    const seatsById = useMemo(() => {
        const m = {};
        if (activeBlock) {
            activeBlock.seatGeo.forEach((g) => { m[g.seat.id] = g.seat; });
        }
        return m;
    }, [activeBlock]);

    const handleClick = (e) => {
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }

        const seatEl = e.target.closest("[data-seat]");
        if (seatEl) {
            const seat = seatsById[seatEl.getAttribute("data-seat")];
            if (seat) { setMessage(""); onSeatClick(seat); }
            return;
        }

        const standEl = e.target.closest("[data-stand]");
        if (standEl) {
            openStand(standEl.getAttribute("data-stand"));
        }
    };

    const handleKey = (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;

        const seatEl = e.target.closest("[data-seat]");
        const standEl = e.target.closest("[data-stand]");

        if (seatEl) {
            e.preventDefault();
            const seat = seatsById[seatEl.getAttribute("data-seat")];
            if (seat) onSeatClick(seat);
        } else if (standEl) {
            e.preventDefault();
            openStand(standEl.getAttribute("data-stand"));
        }
    };

    const zoomButton = (factor) => {
        const v = viewRef.current;
        flyTo({ cx: v.cx, cy: v.cy, w: v.w * factor }, 220);
    };

    const showWhole = () => {
        setMessage("");
        if (activeName) onActiveChange(null);
        else flyTo({ cx: CX, cy: CY, w: MAX_W }, 480);
    };

    // ------------------------------------------------------------
    // draw
    // ------------------------------------------------------------

    const activeStand = activeName ? standByName[activeName] : null;
    const photo = activeStand ? STAND_PHOTOS[standKey(activeStand.name)] : null;
    const freeInStand = activeStand ? activeStand.availableCount : 0;
    const selectedInStand = activeStand
        ? activeStand.seats.filter((s) => selectedSet.has(s.id)).length
        : 0;

    return (
        <div className="sm">
            <section className="sm-stage" aria-label="Stadium map">
                <div className="sm-head">
                    <h2>{activeStand ? activeStand.name : "Choose a stand"}</h2>
                    <span className="sm-hint">
                        {activeStand
                            ? "Tap seats to pick them · scroll or pinch to zoom · drag to move"
                            : "Tap a stand to zoom in · scroll or pinch to zoom · drag to move"}
                    </span>
                </div>

                <div className="sm-box" ref={boxRef}>
                    <svg
                        ref={svgRef}
                        className="sm-svg"
                        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                        role="group"
                        aria-label="Stadium seating map"
                        onClick={handleClick}
                        onKeyDown={handleKey}
                    >
                        <defs>
                            <radialGradient id="smGround" cx="50%" cy="50%" r="60%">
                                <stop offset="0" stopColor="#2b8556" />
                                <stop offset="1" stopColor="#1b5a3a" />
                            </radialGradient>
                        </defs>

                        {/* the ground */}
                        <ellipse cx="500" cy="400" rx="188" ry="146" fill="url(#smGround)" stroke="#0d1020" strokeWidth="3" />
                        <ellipse cx="500" cy="400" rx="150" ry="112" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="5 5" />
                        <rect x="440" y="391" width="120" height="18" rx="3" fill="#d8c47c" opacity=".92" />
                        <text className="sm-ground-lab" x="500" y="400" fontSize="12" style={{ fill: "#3a3320", letterSpacing: ".35em" }}>PITCH</text>

                        {/* empty slots of the rings (walkways, gates) */}
                        {layout.decor.map((d) => (
                            <path key={d.key} d={d.d} className="sm-decor" />
                        ))}

                        {/* stands */}
                        {layout.blocks.map((b) => {
                            const stand = b.stand;
                            const soldOut = stand.availableCount === 0;
                            const isActive = activeName === b.name;
                            const cls =
                                "sm-sec" +
                                (soldOut ? " soldout" : "") +
                                (isActive ? " active" : "") +
                                (activeName && !isActive ? " dim" : "");

                            return (
                                <path
                                    key={b.name}
                                    className={cls}
                                    d={b.d}
                                    style={{ fill: stand.color }}
                                    data-stand={b.name}
                                    data-tip={b.name}
                                    data-tip2={`${priceText(stand)} · ${soldOut ? "Sold out" : `${stand.availableCount} of ${stand.totalCount} free`}`}
                                    tabIndex={soldOut || isActive ? -1 : 0}
                                    role="button"
                                    aria-label={`${b.name}, ${priceText(stand)}, ${soldOut ? "sold out" : `${stand.availableCount} seats free`}`}
                                />
                            );
                        })}

                        {layout.blocks.map((b) => (
                            <text
                                key={`l-${b.name}`}
                                className={`sm-sec-label${activeName ? " hide" : ""}`}
                                x={b.labX}
                                y={b.labY}
                                fontSize={b.labelSize}
                            >
                                {b.label}
                            </text>
                        ))}

                        {/* seats of the open stand */}
                        {activeBlock && (
                            <g>
                                {activeBlock.seatGeo.map(({ seat, x, y, rowName, col }) => {
                                    const booked = seat.status === "booked";
                                    const selected = selectedSet.has(seat.id);
                                    const label = `${rowName}${col + 1}`;

                                    return (
                                        <circle
                                            key={seat.id}
                                            className={`sm-seat${booked ? " sold" : ""}${selected ? " sel" : ""}`}
                                            cx={x}
                                            cy={y}
                                            r={activeBlock.seatR}
                                            style={{ fill: activeBlock.stand.color }}
                                            data-seat={seat.id}
                                            data-tip={booked ? `${label} · Sold` : `${label} · ${money(seat.price)}`}
                                            {...(booked
                                                ? { "aria-hidden": "true" }
                                                : {
                                                    tabIndex: holding ? -1 : 0,
                                                    role: "button",
                                                    "aria-pressed": selected,
                                                    "aria-label": `Seat ${label}, ${money(seat.price)}`
                                                })}
                                        />
                                    );
                                })}

                                {activeBlock.rowLabels.map((r) => (
                                    <text
                                        key={r.name}
                                        className="sm-rowlab"
                                        x={r.x}
                                        y={r.y}
                                        fontSize={activeBlock.rowFont}
                                    >
                                        {r.name}
                                    </text>
                                ))}
                            </g>
                        )}
                    </svg>

                    {activeName && canChangeStand && (
                        <button type="button" className="sm-back" onClick={showWhole}>
                            ← Whole stadium
                        </button>
                    )}

                    <div className="sm-zoom">
                        <button type="button" aria-label="Zoom in" onClick={() => zoomButton(1 / 1.5)}>+</button>
                        <button type="button" aria-label="Zoom out" onClick={() => zoomButton(1.5)}>−</button>
                        <button type="button" aria-label="Show whole stadium" title="Whole stadium" onClick={showWhole}>⤢</button>
                    </div>

                    <div className="sm-tip" ref={tipRef} hidden />
                </div>

                <p className="sm-msg" role="status">{message}</p>

                {/* stands as buttons: handy on a phone and for the keyboard */}
                <div className="sm-legend">
                    {stands.map((stand) => (
                        <button
                            key={stand.name}
                            type="button"
                            className="sm-chip"
                            style={{ "--c": stand.color }}
                            aria-pressed={activeName === stand.name}
                            disabled={stand.availableCount === 0 && activeName !== stand.name}
                            onClick={() => openStand(stand.name)}
                        >
                            <i />
                            <span className="n">{stand.name}</span>
                            <span className="p">{priceText(stand)}</span>
                        </button>
                    ))}
                </div>

                <div className="sm-key">
                    <span><i className="free" />Available</span>
                    <span><i className="sel" />Selected</span>
                    <span><i className="sold" />Sold</span>
                </div>
            </section>

            {/* ---------- side: stand info + the view from the stand ---------- */}
            <aside className="sm-side">
                <div className="sm-card">
                    {activeStand ? (
                        <>
                            <h3>{activeStand.name}</h3>
                            <p className="sub">{activeBlock && activeBlock.tier === "upper" ? "Upper tier" : "Lower tier"}</p>
                            <div className="sm-kv">
                                <div><span>Per seat</span><b>{priceText(activeStand)}</b></div>
                                <div><span>Free</span><b>{freeInStand}</b></div>
                                <div><span>Picked</span><b>{selectedInStand}</b></div>
                            </div>
                            <StandView block={activeBlock} photo={photo} name={activeStand.name} />
                        </>
                    ) : (
                        <>
                            <h3>Find your stand</h3>
                            <p className="sub">
                                The ground is in the middle. The inner ring is closest to the action, the outer ring wraps around it.
                                Tap a block to zoom in and see its seats.
                            </p>
                            <div className="sm-kv">
                                <div><span>Stands</span><b>{stands.length}</b></div>
                                <div>
                                    <span>Seats free</span>
                                    <b>{stands.reduce((a, s) => a + s.availableCount, 0).toLocaleString("en-IN")}</b>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

/* The view from a stand: your photo if you added one, otherwise a drawing. */
function StandView({ block, photo, name }) {
    const [failed, setFailed] = useState(false);
    const art = useMemo(() => ({ __html: viewArtSvg(block) }), [block]);

    useEffect(() => { setFailed(false); }, [photo]);

    const showPhoto = photo && !failed;

    return (
        <div className="sm-view">
            {showPhoto ? (
                <img src={photo} alt={`View from ${name}`} onError={() => setFailed(true)} />
            ) : (
                <svg
                    viewBox="0 0 400 200"
                    role="img"
                    aria-label={`Illustration of the view from ${name}`}
                    dangerouslySetInnerHTML={art}
                />
            )}
            <span className="cap">{showPhoto ? "View from this stand" : "Illustration · add your photo"}</span>
        </div>
    );
}

export default StadiumMap;
