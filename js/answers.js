/* ═══════════════════════════════════════════════════════════
   answers.js — answer parsing & comparison
   Shared by the game and the unit tests so both check
   answers with exactly the same rules.
   ═══════════════════════════════════════════════════════════ */

/** normalise a typed answer: lowercase, strip spaces, "x=", commas,
 *  trailing dots and trailing units (cm, kg, °, ₹, …) */
function normAns(s) {
  s = String(s).trim().toLowerCase().replace(/\s+/g, '');
  s = s.replace(/^(x|y)=/, '');
  s = s.replace(/,/g, '');
  s = s.replace(/\.$/, '');
  s = s.replace(/(sq\.?cm|cm2|cm³|cm3|cubiccm|sq\.?units?|cm|mm|km|m|kg|g|ml|l|₹|rs|°|deg|degrees?)$/u, '');
  return s;
}

/** parse "12", "0.75", "-3/4" → number; null if not numeric */
function toNum(s) {
  if (s === '' || s === '-') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) { const d = parseFloat(m[2]); return d === 0 ? null : parseFloat(m[1]) / d; }
  return null;
}

/** tolerant comparison: exact string, or numeric within 0.002
 *  (tight enough that 0.67 ≠ 2/3, loose enough for decimal rounding) */
function sameAnswer(user, expected) {
  const u = normAns(user), e = normAns(expected);
  if (u === e) return true;
  const uv = toNum(u), ev = toNum(e);
  if (uv !== null && ev !== null) return Math.abs(uv - ev) < 0.002;
  return false;
}

/* Node (unit-test) support */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normAns, toNum, sameAnswer };
}
