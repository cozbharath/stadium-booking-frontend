// Run from the project root:   node retheme.mjs
// Recolors the OLD BLUE theme to the new RED theme in the legacy stylesheet(s).
// Safe to run more than once.
import fs from "fs";

const FILES = [
  "src/index.css",
  "src/components/common/ProfileModal.css",
  "src/pages/admin/ManageEventSeats.jsx",
];

const HEX = {
  "#2563eb": "#f84464", "#1d4ed8": "#dc3558", "#3b82f6": "#f84464", "#1769e0": "#f84464",
  "#60a5fa": "#ff8fa4", "#0ea5e9": "#ff8a5c", "#0284c7": "#dc3558",
  "#1e40af": "#c0264a", "#1e3a8a": "#c0264a",
  "#dbeafe": "#ffe3e8", "#eff6ff": "#fff1f3", "#bfdbfe": "#ffc9d3", "#e0f2fe": "#fff1f3",
  "#123b78": "#1a1a2e", "#123f7a": "#1a1a2e", "#172554": "#0f0f1a",
  "#f5f9ff": "#fafafc", "#f8fbff": "#fafafc", "#eaf5ff": "#f5f5f7", "#eef7ff": "#f5f5f7",
  "#eaf3ff": "#f5f5f7", "#eef2f7": "#f5f5f7", "#edf1f6": "#f2f2f5",
  "#dbe4f0": "#e8e8ee", "#dbe3ef": "#e8e8ee", "#dbe1e8": "#e8e8ee",
};
const RGB = [
  [/rgba\(\s*37\s*,\s*99\s*,\s*235\s*,/gi, "rgba(248, 68, 100,"],
  [/rgba\(\s*59\s*,\s*130\s*,\s*246\s*,/gi, "rgba(248, 68, 100,"],
  [/rgba\(\s*30\s*,\s*64\s*,\s*175\s*,/gi, "rgba(192, 38, 74,"],
  [/rgba\(\s*14\s*,\s*165\s*,\s*233\s*,/gi, "rgba(255, 138, 92,"],
  [/rgba\(\s*96\s*,\s*165\s*,\s*250\s*,/gi, "rgba(255, 143, 164,"],
];

let total = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.log("skip (not found):", f); continue; }
  let s = fs.readFileSync(f, "utf8");
  let n = 0;
  for (const [from, to] of Object.entries(HEX)) {
    s = s.replace(new RegExp(from + "(?![0-9a-fA-F])", "gi"), () => { n++; return to; });
  }
  for (const [re, to] of RGB) s = s.replace(re, () => { n++; return to; });
  fs.writeFileSync(f, s);
  console.log(`${f}: ${n} colours updated`);
  total += n;
}
console.log("done –", total, "replacements");
