// =============================================================
// STADIUM LAYOUT
// Turns the stands that come from the backend into blocks around
// the ground (lower tier close to the pitch, upper tier outside),
// and works out where every seat sits inside its block.
// =============================================================

export const CX = 500;
export const CY = 400;
export const VIEW_W = 1000;
export const VIEW_H = 800;
export const VIEW_RATIO = VIEW_H / VIEW_W;
export const MAX_W = VIEW_W;
export const MIN_W = 24;

// Two rings around the ground (radii in map units)
export const TIERS = {
    lower: { rx0: 205, rx1: 318, ry0: 160, ry1: 252 },
    upper: { rx0: 334, rx1: 462, ry0: 268, ry1: 372 }
};

/*
 * OPTIONAL: say exactly where a stand sits.
 *
 * key    = the stand name from your backend, in lower case
 * tier   = "lower" or "upper"
 * angle  = direction of the stand's centre in degrees, clockwise from the top
 *          (0 = top, 90 = right, 180 = bottom, 270 = left)
 * span   = how wide the stand is, in degrees (up to 170)
 *
 * Stands that are not listed here are placed automatically:
 * the most expensive stands go to the lower tier, the rest to the upper tier.
 */
export const STAND_LAYOUT = {
    // "pavilion stand": { tier: "lower", angle: 270, span: 70 },
    // "north stand": { tier: "upper", angle: 0, span: 60 },
};

/*
 * OPTIONAL: a real photo of the view from each stand.
 * Put the pictures in the "public/stand-views" folder and list them here.
 * Stands without a photo show a drawn illustration instead.
 */
export const STAND_PHOTOS = {
    // "pavilion stand": "/stand-views/pavilion.jpg",
};

// -------------------------------------------------------------
// small helpers
// -------------------------------------------------------------

const round = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function point(tier, t, angle) {
    const T = TIERS[tier];
    const rx = T.rx0 + (T.rx1 - T.rx0) * t;
    const ry = T.ry0 + (T.ry1 - T.ry0) * t;
    return [CX + rx * Math.cos(angle), CY + ry * Math.sin(angle)];
}

export function standKey(name) {
    return String(name || "").trim().toLowerCase();
}

export function standAbbr(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

export function hash01(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
}

// -------------------------------------------------------------
// ROWS OF A STAND
// Uses the row/column from the backend when it has them,
// otherwise lays the seats out 20 to a row (A1-A20, B1-B20 ...).
// Returns [[rowName, [seat, seat, ...]], ...]
// -------------------------------------------------------------

export function buildRows(standSeats) {
    if (!standSeats || !standSeats.length) {
        return [];
    }

    const hasRealRows = standSeats.some(
        (seat) =>
            seat.row !== null &&
            seat.row !== undefined &&
            String(seat.row).trim() !== ""
    );

    if (hasRealRows) {
        const grouped = {};

        standSeats.forEach((seat) => {
            const rowName = String(seat.row ?? "A").toUpperCase();

            if (!grouped[rowName]) {
                grouped[rowName] = [];
            }

            grouped[rowName].push(seat);
        });

        return Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
            .map(([rowName, rowSeats]) => [
                rowName,
                [...rowSeats].sort((a, b) => {
                    if (a.column !== null && b.column !== null) {
                        return Number(a.column) - Number(b.column);
                    }

                    return a.sortNumber - b.sortNumber;
                })
            ]);
    }

    const SEATS_PER_ROW = 20;
    const generatedRows = [];

    for (let i = 0; i < standSeats.length; i += SEATS_PER_ROW) {
        generatedRows.push([
            rowLetters(generatedRows.length),
            standSeats.slice(i, i + SEATS_PER_ROW)
        ]);
    }

    return generatedRows;
}

// A, B ... Z, AA, AB ... (stands with more than 26 rows)
function rowLetters(index) {
    let n = index;
    let out = "";

    do {
        out = String.fromCharCode(65 + (n % 26)) + out;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);

    return out;
}

// -------------------------------------------------------------
// BLOCK SHAPES
// -------------------------------------------------------------

function wedge(tier, a0, a1) {
    const T = TIERS[tier];
    const p1 = point(tier, 1, a0);
    const p2 = point(tier, 1, a1);
    const p3 = point(tier, 0, a1);
    const p4 = point(tier, 0, a0);
    const large = a1 - a0 > Math.PI ? 1 : 0;

    const d =
        `M${round(p1[0])} ${round(p1[1])} ` +
        `A${T.rx1} ${T.ry1} 0 ${large} 1 ${round(p2[0])} ${round(p2[1])} ` +
        `L${round(p3[0])} ${round(p3[1])} ` +
        `A${T.rx0} ${T.ry0} 0 ${large} 0 ${round(p4[0])} ${round(p4[1])} Z`;

    const xs = [p1[0], p2[0], p3[0], p4[0]];
    const ys = [p1[1], p2[1], p3[1], p4[1]];

    [0.25, 0.5, 0.75].forEach((k) => {
        const outer = point(tier, 1, a0 + (a1 - a0) * k);
        const inner = point(tier, 0, a0 + (a1 - a0) * k);
        xs.push(outer[0], inner[0]);
        ys.push(outer[1], inner[1]);
    });

    return {
        d,
        bbox: {
            x0: Math.min(...xs),
            x1: Math.max(...xs),
            y0: Math.min(...ys),
            y1: Math.max(...ys)
        }
    };
}

// -------------------------------------------------------------
// MAIN: place every stand and every seat
// stands       = [{ name, color, seats, ... }]  (most expensive first)
// rowsByStand  = { [standName]: [[rowName, seats[]], ...] }
// -------------------------------------------------------------

export function layoutStands(stands, rowsByStand) {
    const GAP = 0.011;
    const placed = [];
    const auto = [];

    stands.forEach((stand) => {
        const custom = STAND_LAYOUT[standKey(stand.name)];

        if (custom && TIERS[custom.tier]) {
            const centre = ((custom.angle ?? 0) * Math.PI) / 180 - Math.PI / 2;
            const half = (clamp(custom.span ?? 40, 10, 170) / 2) * (Math.PI / 180);

            placed.push({
                stand,
                tier: custom.tier,
                a0: centre - half + GAP,
                a1: centre + half - GAP
            });
        } else {
            auto.push(stand);
        }
    });

    const lowerCount = auto.length <= 2 ? auto.length : Math.ceil(auto.length / 2);
    const groups = { lower: auto.slice(0, lowerCount), upper: auto.slice(lowerCount) };
    const decor = [];

    Object.keys(groups).forEach((tier) => {
        const list = groups[tier];
        const slots = list.length === 0 ? (tier === "lower" ? 12 : 16) : Math.max(list.length, 4);
        const step = (2 * Math.PI) / slots;
        const used = new Set();

        list.forEach((stand, i) => {
            let slot = Math.round((i * slots) / list.length) % slots;

            while (used.has(slot)) {
                slot = (slot + 1) % slots;
            }

            used.add(slot);

            const a0 = -Math.PI / 2 - step / 2 + slot * step + GAP;
            const a1 = -Math.PI / 2 - step / 2 + (slot + 1) * step - GAP;

            placed.push({ stand, tier, a0, a1 });
        });

        for (let slot = 0; slot < slots; slot += 1) {
            if (!used.has(slot)) {
                const a0 = -Math.PI / 2 - step / 2 + slot * step + GAP;
                const a1 = -Math.PI / 2 - step / 2 + (slot + 1) * step - GAP;

                decor.push({ key: `${tier}-${slot}`, d: wedge(tier, a0, a1).d });
            }
        }
    });

    const blocks = placed.map(({ stand, tier, a0, a1 }) => {
        const shape = wedge(tier, a0, a1);
        const mid = (a0 + a1) / 2;
        const rows = rowsByStand[stand.name] || [];
        const rowCount = rows.length;
        const maxCols = Math.max(1, ...rows.map(([, seats]) => seats.length));

        // how much room there is inside the block
        const inner = point(tier, 0, mid);
        const outer = point(tier, 1, mid);
        const thickness = Math.hypot(outer[0] - inner[0], outer[1] - inner[1]);

        const span = a1 - a0;
        const margin = span * 0.06;
        const mp = point(tier, 0.5, a0 + margin);
        const mq = point(tier, 0.5, a1 - margin);
        let arc = 0;
        let prev = mp;

        for (let k = 1; k <= 12; k += 1) {
            const q = point(tier, 0.5, a0 + margin + (span - 2 * margin) * (k / 12));
            arc += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
            prev = q;
        }

        const PAD = 0.05;
        const colPitch = arc / maxCols;
        const maxRowPitch = (thickness * (1 - 2 * PAD)) / Math.max(rowCount, 1);
        // keep a few rows tight together instead of spreading them over the whole block
        const rowPitch = Math.min(maxRowPitch, colPitch * 1.25);
        const pitch = Math.min(rowPitch, colPitch);
        const seatR = clamp(pitch * 0.4, 0.35, 3.4);

        const seatGeo = [];

        rows.forEach(([rowName, rowSeats], r) => {
            const t = 0.5 + ((r + 0.5) - rowCount / 2) * (rowPitch / thickness);

            rowSeats.forEach((seat, c) => {
                const angle = a0 + margin + (span - 2 * margin) * ((c + 0.5) / maxCols);
                const p = point(tier, t, angle);

                seatGeo.push({ seat, x: round(p[0] * 10) / 10, y: round(p[1] * 10) / 10, rowName, col: c });
            });
        });

        const rowLabels = [];
        const every = Math.max(1, Math.ceil(3.2 / Math.max(rowPitch, 0.1)));

        rows.forEach(([rowName], r) => {
            if (r % every !== 0) return;
            const t = 0.5 + ((r + 0.5) - rowCount / 2) * (rowPitch / thickness);
            const p = point(tier, t, a0 + span * 0.03);

            rowLabels.push({ name: rowName, x: round(p[0]), y: round(p[1]) });
        });

        // name on the block
        const chord = Math.hypot(mq[0] - mp[0], mq[1] - mp[1]);
        const label = stand.name.length <= 14 ? stand.name : standAbbr(stand.name);
        const labelSize = clamp(chord / (label.length * 0.62), 6, 13);
        const lab = point(tier, 0.5, mid);

        return {
            name: stand.name,
            stand,
            tier,
            a0,
            a1,
            mid,
            d: shape.d,
            bbox: shape.bbox,
            label,
            labelSize: round(labelSize),
            labX: round(lab[0]),
            labY: round(lab[1]),
            seatGeo,
            seatR: round(seatR * 100) / 100,
            rowLabels,
            rowFont: round(clamp(rowPitch * 0.8, 1.4, 4.6)),
            pitch
        };
    });

    const byName = {};
    blocks.forEach((b) => { byName[b.name] = b; });

    return { blocks, decor, byName };
}

// -------------------------------------------------------------
// WHERE THE CAMERA GOES WHEN A STAND IS TAPPED
// -------------------------------------------------------------

export function cameraFor(block, containerWidth) {
    const b = block.bbox;
    const bw = b.x1 - b.x0;
    const bh = b.y1 - b.y0;
    const fit = Math.max(bw * 1.3, (bh * 1.3) / VIEW_RATIO);
    // zoom in far enough that a seat is about 16px wide on screen
    const dense = (block.pitch * Math.max(containerWidth, 280)) / 16;

    return {
        cx: (b.x0 + b.x1) / 2,
        cy: (b.y0 + b.y1) / 2,
        w: clamp(Math.min(fit, dense), MIN_W, MAX_W)
    };
}

// -------------------------------------------------------------
// ILLUSTRATION: the "view from your stand" shown until you add a photo
// -------------------------------------------------------------

export function viewArtSvg(block) {
    const upper = block && block.tier === "upper";
    const broad = block ? Math.abs(Math.sin(block.mid)) > 0.5 : true;
    const seedName = block ? block.name : "";
    const hz = upper ? 64 : 80;
    const bottom = 200;
    let a = "";

    a += '<defs><linearGradient id="smSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1330"/><stop offset="1" stop-color="#3c3f86"/></linearGradient>' +
        '<linearGradient id="smGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8758"/><stop offset="1" stop-color="#17492f"/></linearGradient></defs>';
    a += `<rect width="400" height="${hz}" fill="url(#smSky)"/>`;

    [[40, 16], [360, 16]].forEach(([x, y]) => {
        a += `<rect x="${x - 1}" y="${y}" width="2" height="${hz - y}" fill="#242a58"/><circle cx="${x}" cy="${y}" r="5" fill="#fff6c8" opacity=".9"/>`;
    });

    a += `<rect y="${hz - 26}" width="400" height="26" fill="#1e2350"/>`;

    const colours = ["#f4b63a", "#8a6bff", "#3a8cf5", "#20b07c", "#f84464"];

    for (let r = 0; r < 3; r += 1) {
        for (let i = 0; i < 64; i += 1) {
            const h = hash01(`c${r}-${i}${seedName}`);

            a += `<circle cx="${3 + i * 6.2}" cy="${hz - 20 + r * 7}" r="1.7" fill="${colours[Math.floor(h * 5)]}" opacity=".55"/>`;
        }
    }

    a += `<rect y="${hz}" width="400" height="${bottom - hz}" fill="url(#smGrass)"/>`;

    for (let k = 0; k < 9; k += 1) {
        const y0 = hz + (bottom - hz) * Math.pow(k / 9, 1.7);
        const y1 = hz + (bottom - hz) * Math.pow((k + 1) / 9, 1.7);

        if (k % 2) {
            a += `<rect y="${round(y0)}" width="400" height="${round(y1 - y0)}" fill="#fff" opacity=".045"/>`;
        }
    }

    if (broad) {
        a += `<polygon points="70,${hz + 30} 330,${hz + 30} 352,${hz + 44} 48,${hz + 44}" fill="#d8c47c" opacity=".9"/>`;
    } else {
        const top = upper ? 11 : 15;
        const bw = upper ? 52 : 92;
        const yb = upper ? 150 : 176;

        a += `<polygon points="${200 - top},${hz + 4} ${200 + top},${hz + 4} ${200 + bw},${yb} ${200 - bw},${yb}" fill="#d8c47c" opacity=".9"/>`;
    }

    a += `<rect y="${bottom - (upper ? 20 : 12)}" width="400" height="${upper ? 20 : 12}" fill="#0a0c1c"/>`;

    if (upper) {
        for (let j = 0; j < 20; j += 1) {
            a += `<rect x="${j * 20 + 3}" y="${bottom - 17}" width="14" height="6" rx="2" fill="#20254a"/>`;
        }
    }

    return a;
}
