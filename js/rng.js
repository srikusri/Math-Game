/* ═══════════════════════════════════════════════════════════
   rng.js — random + math helpers used by question generators
   ═══════════════════════════════════════════════════════════ */

const R = {
  /** random integer a..b inclusive */
  int(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  /** n distinct random ints from a..b */
  sample(a, b, n) { return R.shuffle([...Array(b - a + 1)].map((_, i) => a + i)).slice(0, n); },
  nonzero(a, b) { let v; do { v = R.int(a, b); } while (v === 0); return v; },
  /** multiple of k in range lo..hi */
  multipleOf(k, lo, hi) {
    const start = Math.ceil(lo / k) * k;
    if (start > hi) return start;
    const count = Math.floor((hi - start) / k) + 1;
    return start + R.int(0, count - 1) * k;
  }
};

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

/** reduced fraction, sign kept on numerator */
function reduceFrac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
function fmtFrac(n, d) {
  const f = reduceFrac(n, d);
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
}
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

/** 5-digit number with all-distinct digits (first not zero) */
function distinctDigitsNumber(len) {
  const digits = R.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  if (digits[0] === 0) [digits[0], digits[9]] = [digits[9], digits[0]];
  return +digits.slice(0, len).join('');
}

/** format integer with Indian-style commas e.g. 47382 -> 47,382 */
function inFormat(n) {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}
