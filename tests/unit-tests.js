#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   Unit tests for Math Treasure Hunt question generators.
   Run:  node tests/unit-tests.js

   Three layers of testing:
   1. Answer-normalisation tests (sameAnswer / toNum / normAns)
   2. STRUCTURAL checks on every generated question
      (answer present, MCQ choices valid, no NaN/undefined, hints, svg)
   3. MATH VERIFICATION: for every generator, a verifier that
      PARSES THE QUESTION TEXT and recomputes the answer with
      independent arithmetic — this is what catches bugs like a
      place-value answer computed from the wrong digit position.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const { R, inFormat } = require('../js/rng.js');
const ART = require('../js/art.js');
globalThis.ART = ART; // generators embed art
const { normAns, toNum, sameAnswer } = require('../js/answers.js');
const Q = require('../js/questions.js');
const { BANK, drawQuestion } = Q;

/* ── tiny test framework ── */
let pass = 0, fail = 0;
const failures = [];
function T(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(`  ✗ ${name}\n      ${e.message}`); }
}
function ok(v, m) { if (!v) throw new Error(m || 'expected truthy'); }
function eq(a, b, m) { if (a !== b) throw new Error(`${m ? m + ': ' : ''}expected "${b}" got "${a}"`); }
function near(a, b, t = 0.005, m = '') { if (Math.abs(a - b) > t) throw new Error(`${m}expected ~${b} got ${a}`); }

/* ── independent helpers (NOT reusing the app's own math) ── */
const N = s => parseFloat(String(s).replace(/,/g, ''));
const clean = q => String(q).replace(/\u2212/g, '-').replace(/\s+/g, ' ');
function red(n, d) { // reduce a fraction to "p" or "p/q", sign on numerator
  if (d < 0) { n = -n; d = -d; }
  let a = Math.abs(n), b = d;
  while (b) { [a, b] = [b, a % b]; }
  const g = a || 1;
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
}
const val = s => { // evaluate an answer string ("3/4", "-2", "5", "25,967") to a number
  const n = toNum(normAns(s));
  if (n === null) throw new Error(`answer "${s}" is not numeric/parseable`);
  return n;
};

/* ══════════ 1. answer normalisation ══════════ */
T('norm: fraction equals decimal', () => { ok(sameAnswer('3/4', '0.75')); ok(sameAnswer('0.75', '3/4')); });
T('norm: x= prefix accepted', () => ok(sameAnswer('x=5', '5')));
T('norm: units stripped', () => {
  ok(sameAnswer('12 cm', '12'), 'cm');
  ok(sameAnswer('48g', '48'), 'g');
  ok(sameAnswer('70°', '70'), 'deg');
  ok(sameAnswer('350 m', '350'), 'm');
  ok(sameAnswer('5 km', '5'), 'km');
});
T('norm: commas stripped', () => ok(sameAnswer('47,000', '47000')));
T('norm: case/space insensitive', () => ok(sameAnswer('  3/4 ', '3/4')));
T('norm: negative fractions', () => ok(sameAnswer('-3/4', '-0.75')));
T('norm: wrong answers stay wrong', () => {
  ok(!sameAnswer('11', '12'));
  ok(!sameAnswer('2/3', '3/2'));
  ok(!sameAnswer('0.67', '2/3'), '2/3 is not 0.67 (tolerance 0.005)');
  ok(!sameAnswer('', '0'));
  ok(!sameAnswer('abc', '3'));
});

/* ══════════ 2+3. per-generator structural + math verification ══════════ */

const VERIFIERS = {

  g5_numbers(qd) {
    const t = clean(qd.q);
    let m = t.match(/^Round ([\d,]+) to the nearest (10|100|1000)\.$/);
    if (m) return eq(qd.a, String(Math.round(N(m[1]) / +m[2]) * +m[2]), 'rounding');
    m = t.match(/^Which number is GREATER\?$/);
    if (m) return near(val(qd.a), Math.max(...qd.choices.map(val)), 1e-9, 'greater-of-two');
    m = t.match(/^In the number ([\d,]+), what is the place value of the digit (\d)\?$/);
    ok(m, 'unrecognized question text');
    const digits = String(N(m[1]));
    const d = m[2];
    ok(digits.split('').filter(c => c === d).length === 1, 'digit must appear exactly once');
    const idx = digits.indexOf(d); // 0 = leftmost
    eq(qd.a, String(+d * Math.pow(10, digits.length - 1 - idx)), `place value of ${d} in ${m[1]}`);
  },

  g5_muldiv(qd) {
    const t = clean(qd.q);
    let m = t.match(/(\d+) treasure bags with (\d+) coins/);
    if (m) return eq(qd.a, String(+m[1] * +m[2]));
    m = t.match(/(\d+) gold coins are shared equally among (\d+) pirates/);
    if (m) { ok(+m[1] % +m[2] === 0, 'total not divisible'); return eq(qd.a, String(+m[1] / +m[2])); }
    m = t.match(/Find the REMAINDER when (\d+) is divided by (\d+)\./);
    ok(m, 'unrecognized');
    return eq(qd.a, String(+m[1] % +m[2]));
  },

  g5_fractions(qd) {
    const t = clean(qd.q);
    let m = t.match(/Add: (\d+)\/(\d+) \+ (\d+)\/(\d+)/);
    if (m) {
      const exp = red(+m[1] * +m[4] + +m[3] * +m[2], +m[2] * +m[4]);
      return near(val(qd.a), val(exp), 1e-9, `expected ${exp}`);
    }
    m = t.match(/Simplify this fraction fully: (\d+)\/(\d+)/);
    if (m) return near(val(qd.a), val(red(+m[1], +m[2])), 1e-9);
    m = t.match(/Which fraction is GREATER\?/);
    ok(m, 'unrecognized');
    return near(val(qd.a), Math.max(...qd.choices.map(val)), 1e-9);
  },

  g5_decimals(qd) {
    const t = clean(qd.q);
    let m = t.match(/holds ([\d.]+) kg of gold\. The crew (adds|takes away) ([\d.]+) kg/);
    if (m) return near(val(qd.a), m[2] === 'adds' ? +m[1] + +m[3] : +m[1] - +m[3]);
    m = t.match(/What is ([\d.]+) × (\d+)\?/);
    if (m) return near(val(qd.a), +m[1] * +m[2]);
    m = t.match(/Which decimal is GREATER\?/);
    ok(m, 'unrecognized');
    return near(val(qd.a), Math.max(...qd.choices.map(val)), 1e-9);
  },

  g5_shapes(qd) {
    const t = clean(qd.q);
    let m = t.match(/What TYPE of angle is shown here\?/);
    if (m) {
      ok(['Acute angle', 'Right angle', 'Obtuse angle'].includes(qd.a), 'bad angle type');
      ok(qd.svg, 'angle question needs svg');
      if (qd.a === 'Right angle') {
        ok(qd.svg.includes('<rect'), 'right-angle svg must draw the corner square');
      } else {
        const lines = [...qd.svg.matchAll(/<line x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/g)]
          .map(x => x.slice(1).map(Number));
        const arm = lines.find(l => Math.abs(l[3] - l[1]) > 1);
        ok(arm, 'no angled arm in svg');
        const deg = Math.round(Math.atan2(100 - arm[3], arm[2] - 40) * 180 / Math.PI);
        eq(qd.a, deg < 90 ? 'Acute angle' : 'Obtuse angle', `svg actually draws ${deg}°`);
      }
      return;
    }
    m = t.match(/A SQUARE [^?]*? has sides of (\d+) cm\. What is its (AREA|PERIMETER)/);
    if (m) { const s = +m[1]; return eq(qd.a, String(m[2] === 'AREA' ? s * s : 4 * s)); }
    m = t.match(/measures (\d+) cm by (\d+) cm\. What is its (AREA|PERIMETER)/);
    if (m) { const [w, h] = [+m[1], +m[2]]; return eq(qd.a, String(m[3] === 'AREA' ? w * h : 2 * (w + h))); }
    m = t.match(/flat shape with exactly (\d+) sides\?/);
    if (m) {
      const names = { 3: 'Triangle', 4: 'Quadrilateral', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon' };
      return eq(qd.a, names[+m[1]]);
    }
    m = t.match(/How many sides does a (\w+) have\?/);
    if (m) {
      const sides = { Triangle: 3, Pentagon: 5, Hexagon: 6, Heptagon: 7, Octagon: 8 };
      return eq(qd.a, String(sides[m[1]]));
    }
    ok(false, 'unrecognized: ' + t);
  },

  g5_measure(qd) {
    const t = clean(qd.q);
    let m = t.match(/rope is ([\d,]+) cm long\. How many METRES/);
    if (m) return near(val(qd.a), N(m[1]) / 100);
    m = t.match(/chest is ([\d.]+) m tall\. How many CENTIMETRES/);
    if (m) return near(val(qd.a), +m[1] * 100);
    m = t.match(/weighs (\d+) kg\. How many GRAMS/);
    if (m) return eq(qd.a, String(+m[1] * 1000));
    m = t.match(/compass costs ₹(\d+)\. Captain Rani buys (\d+) compasses\. How much does she pay/);
    if (m) return eq(qd.a, String(+m[1] * +m[2]));
    ok(false, 'unrecognized: ' + t);
  },

  g6_integers(qd) {
    const t = clean(qd.q);
    let m = t.match(/Simplify: \((-?\d+)\) \+ \((-?\d+)\) = \?/);
    if (m) return eq(qd.a, String(+m[1] + +m[2]));
    m = t.match(/Simplify: \((-?\d+)\) - \((-?\d+)\) = \?/);
    if (m) return eq(qd.a, String(+m[1] - +m[2]));
    m = t.match(/Which of these integers is the GREATEST\?/);
    if (m) return near(val(qd.a), Math.max(...qd.choices.map(val)), 1e-9);
    m = t.match(/At sunrise it was (-?\d+)°C\. By noon it rose by (\d+)°C\./);
    ok(m, 'unrecognized');
    return eq(qd.a, String(+m[1] + +m[2]));
  },

  g6_fractions(qd) {
    const t = clean(qd.q);
    let m = t.match(/(\d+)\/(\d+) × (\d+)\/(\d+) = \?/); // two fractions FIRST
    if (m) return near(val(qd.a), (+m[1] * +m[3]) / (+m[2] * +m[4]), 1e-9);
    m = t.match(/Add: (\d+)\/(\d+) \+ (\d+)\/(\d+)/);
    if (m) return near(val(qd.a), val(red(+m[1] * +m[4] + +m[3] * +m[2], +m[2] * +m[4])), 1e-9);
    m = t.match(/(\d+) × (\d+)\/(\d+) = \?/); // whole × fraction
    if (m) return near(val(qd.a), (+m[1] * +m[2]) / +m[3], 1e-9);
    ok(false, 'unrecognized: ' + t);
  },

  g6_decimals(qd) {
    const t = clean(qd.q);
    let m = t.match(/A gem weighs ([\d.]+) g\. What is the weight of (\d+) such gems\?/);
    if (m) return near(val(qd.a), +m[1] * +m[2]);
    m = t.match(/What is (\d+) ÷ (\d+)\?/);
    ok(m, 'unrecognized');
    return near(val(qd.a), +m[1] / +m[2], 1e-9);
  },

  g6_ratio(qd) {
    const t = clean(qd.q);
    let m = t.match(/in the ratio (\d+) : (\d+)\. Simplify this ratio fully/);
    if (m) {
      const mm = qd.a.match(/^(\d+):(\d+)$/);
      ok(mm, 'answer must be "p:q", got ' + qd.a);
      const [p, q] = [+mm[1], +mm[2]];
      ok(p * +m[2] === q * +m[1], `${p}:${q} != ${m[1]}:${m[2]}`);
      let a = p, b = q; while (b) { [a, b] = [b, a % b]; }
      ok(a === 1, 'ratio not fully simplified');
      return;
    }
    m = t.match(/(\d+) gold coins are divided between two pirates in the ratio (\d+) : (\d+)\./);
    if (m) {
      const [total, p1, p2] = [+m[1], +m[2], +m[3]];
      ok(p1 !== p2, 'shares must differ (larger is ambiguous)');
      ok(total % (p1 + p2) === 0, 'total not divisible by parts');
      return eq(qd.a, String(Math.max(p1, p2) * (total / (p1 + p2))));
    }
    m = t.match(/(\d+) : (\d+) :: (\d+) : \?/);
    ok(m, 'unrecognized');
    const [a1, b1, c1] = [+m[1], +m[2], +m[3]];
    ok(a1 * val(qd.a) === b1 * c1, `proportion broken: ${a1}·${qd.a} != ${b1}·${c1}`);
  },

  g6_algebra(qd) {
    const t = clean(qd.q);
    let m = t.match(/If x = (\d+), find the value of (\d+)x \+ (\d+)\./);
    if (m) return eq(qd.a, String(+m[1] * +m[2] + +m[3]));
    m = t.match(/starts: ((?:\d+, )+\d+), … What is its (\d+)th term\?/);
    if (m) {
      const terms = m[1].split(', ').map(Number);
      const d = terms[1] - terms[0];
      ok(terms.every((v, i) => v === terms[0] + i * d), 'sequence is not arithmetic');
      return eq(qd.a, String(terms[0] + (+m[2] - 1) * d));
    }
    m = t.match(/Solve for x: x \+ (\d+) = (\d+)/);
    ok(m, 'unrecognized');
    return eq(qd.a, String(+m[2] - +m[1]));
  },

  g6_geometry(qd) {
    const t = clean(qd.q);
    let m = t.match(/Two angles of this triangle are (\d+)° and (\d+)°\. Find the third angle/);
    if (m) { const exp = 180 - +m[1] - +m[2]; ok(exp > 0, 'third angle not positive'); return eq(qd.a, String(exp)); }
    m = t.match(/An angle measures (\d+)°\. What is its (COMPLEMENTARY|SUPPLEMENTARY) angle\?/);
    ok(m, 'unrecognized');
    return eq(qd.a, String((m[2] === 'COMPLEMENTARY' ? 90 : 180) - +m[1]));
  },

  g7_integers(qd) {
    const t = clean(qd.q);
    let m = t.match(/Multiply: \((-?\d+)\) × \((-?\d+)\) = \?/);
    if (m) return eq(qd.a, String(+m[1] * +m[2]));
    m = t.match(/Divide: \((-?\d+)\) ÷ \((-?\d+)\) = \?/);
    if (m) { ok(+m[1] % +m[2] === 0, 'division not exact'); return eq(qd.a, String(+m[1] / +m[2])); }
    m = t.match(/Simplify: (\d+) \+ (\d+) ÷ (\d+) × (\d+) \(BODMAS/);
    ok(m, 'unrecognized');
    ok(+m[2] % +m[3] === 0, 'BODMAS division not exact');
    return eq(qd.a, String(+m[1] + (+m[2] / +m[3]) * +m[4]));
  },

  g7_equations(qd) {
    const t = clean(qd.q);
    let m = t.match(/Solve for x: (\d+)x ([+-]) (\d+) = (-?\d+)/);
    if (m) {
      const a = +m[1], s = m[2] === '-' ? -1 : 1, b = +m[3], c = +m[4];
      const x = (c - s * b) / a;
      ok(Number.isInteger(x), `x not integer: ${x}`);
      return eq(qd.a, String(x));
    }
    m = t.match(/Solve for x: x\/(\d+) = (\d+)/);
    if (m) return eq(qd.a, String(+m[1] * +m[2]));
    m = t.match(/A pirate buys (\d+) spyglasses and a map for (\d+) coins\. She pays (\d+) coins in all\./);
    ok(m, 'unrecognized');
    const [n, e, tot] = [+m[1], +m[2], +m[3]];
    ok((tot - e) % n === 0, 'word problem not integer');
    return eq(qd.a, String((tot - e) / n));
  },

  g7_percent(qd) {
    const t = clean(qd.q);
    let m = t.match(/A chest has (\d+) coins\. The crew pays (\d+)% of them as harbour tax\./);
    if (m) return eq(qd.a, String(+m[1] * +m[2] / 100));
    m = t.match(/In a class of (\d+) pirates-in-training, ([\d.]+) can swim\. What PERCENT can swim\?/);
    if (m) {
      ok(Number.isInteger(+m[2]), 'swimmer head-count must be a whole number, got ' + m[2]);
      return eq(qd.a, String(Math.round(+m[2] * 100 / +m[1])));
    }
    m = t.match(/price of a treasure map (rose|fell) from ₹(\d+) by (\d+)%\. What is the NEW price\?/);
    ok(m, 'unrecognized');
    const [n, p] = [+m[2], +m[3]];
    ok((n * p) % 100 === 0, 'result not integer');
    return eq(qd.a, String(m[1] === 'rose' ? n + n * p / 100 : n - n * p / 100));
  },

  g7_profit_si(qd) {
    const t = clean(qd.q);
    let m = t.match(/deposits ₹(\d+) in the Pirate Bank at (\d+)% per year SIMPLE INTEREST\. How much interest after (\d+) years?\?/);
    if (m) return eq(qd.a, String(+m[1] * +m[2] * +m[3] / 100));
    m = t.match(/bought for ₹(\d+) and sold for ₹(\d+)\. Find the (LOSS|PROFIT) percent\./);
    ok(m, 'unrecognized');
    const [cp, sp] = [+m[1], +m[2]];
    const pct = Math.abs(sp - cp) * 100 / cp;
    ok(Number.isInteger(pct), 'percent not integer');
    ok((m[3] === 'PROFIT') === (sp > cp), 'PROFIT/LOSS word contradicts CP/SP');
    return eq(qd.a, String(pct));
  },

  g7_angles(qd) {
    const t = clean(qd.q);
    let m = t.match(/Two angles are (complementary|supplementary)\. One angle is (\d+)°\. Find the other\./);
    if (m) return eq(qd.a, String((m[1] === 'complementary' ? 90 : 180) - +m[2]));
    m = t.match(/Two interior angles of a triangle are (\d+)° and (\d+)°\. What is the EXTERIOR angle/);
    if (m) return eq(qd.a, String(+m[1] + +m[2]));
    m = t.match(/One angle is (\d+)°\. What is the CO-INTERIOR angle on the same side\?/);
    ok(m, 'unrecognized');
    ok(qd.choices.map(val).includes(+m[1]), 'given angle must be among the choices');
    return eq(qd.a, String(180 - +m[1]));
  },

  g7_exponents(qd) {
    const t = clean(qd.q);
    let m = t.match(/Evaluate: (\d+)\^(\d+)/);
    if (m) return eq(qd.a, String(Math.pow(+m[1], +m[2])));
    m = t.match(/Fill the blank: (\d+)\^(\d+) × (\d+)\^(\d+) = (\d+)\^\?/);
    if (m) { ok(m[1] === m[3], 'bases must match'); return eq(qd.a, String(+m[2] + +m[4])); }
    m = t.match(/Fill the blank: (\d+)\^(\d+) ÷ (\d+)\^(\d+) = (\d+)\^\?/);
    ok(m, 'unrecognized');
    ok(m[1] === m[3], 'bases must match');
    return eq(qd.a, String(+m[2] - +m[4]));
  },

  g8_rational(qd) {
    const t = clean(qd.q);
    let m = t.match(/Simplify: \((-?\d+)\/(\d+)\) \+ \((-?\d+)\/(\d+)\) = \?/);
    if (m) return near(val(qd.a), val(red(+m[1] * +m[4] + +m[3] * +m[2], +m[2] * +m[4])), 1e-9);
    m = t.match(/Simplify: \((-?\d+)\/(\d+)\) - \((-?\d+)\/(\d+)\) = \?/);
    if (m) return near(val(qd.a), val(red(+m[1] * +m[4] - +m[3] * +m[2], +m[2] * +m[4])), 1e-9);
    m = t.match(/Multiply: \((-?\d+)\/(\d+)\) × \((-?\d+)\/(\d+)\) = \?/);
    ok(m, 'unrecognized');
    return near(val(qd.a), val(red(+m[1] * +m[3], +m[2] * +m[4])), 1e-9);
  },

  g8_linear(qd) {
    const t = clean(qd.q);
    let m = t.match(/Solve for x: (\d+)x \+ (\d+) = (\d+)x ([+-]) (\d+)/);
    if (m) {
      const a = +m[1], b = +m[2], c = +m[3], s = m[4] === '-' ? -1 : 1, d = +m[5];
      const x = (s * d - b) / (a - c);
      ok(Number.isInteger(x), `x not integer: ${x}`);
      return eq(qd.a, String(x));
    }
    m = t.match(/Solve for x: (\d+)\(x \+ (\d+)\) = (\d+)/);
    ok(m, 'unrecognized');
    ok(+m[3] % +m[1] === 0, 'rhs not divisible');
    return eq(qd.a, String(+m[3] / +m[1] - +m[2]));
  },

  g8_roots(qd) {
    const t = clean(qd.q);
    let m = t.match(/Find the square root: √(\d+)/);
    if (m) { const r = Math.sqrt(+m[1]); ok(Number.isInteger(r), `${m[1]} not a perfect square`); return eq(qd.a, String(r)); }
    m = t.match(/Find the cube root: ∛(\d+)/);
    if (m) { const r = Math.round(Math.cbrt(+m[1])); ok(r ** 3 === +m[1], 'not a perfect cube'); return eq(qd.a, String(r)); }
    m = t.match(/Find the square: (\d+)²/);
    if (m) return eq(qd.a, String((+m[1]) ** 2));
    m = t.match(/Find the cube: (\d+)³/);
    if (m) return eq(qd.a, String((+m[1]) ** 3));
    m = t.match(/Is (\d+) a PERFECT SQUARE\?/);
    ok(m, 'unrecognized');
    return eq(qd.a, Number.isInteger(Math.sqrt(+m[1])) ? 'Yes' : 'No');
  },

  g8_powers(qd) {
    const t = clean(qd.q);
    let m = t.match(/Evaluate: (\d+)\^-(\d+)/);
    if (m) return near(val(qd.a), 1 / Math.pow(+m[1], +m[2]), 1e-9, `expected 1/${Math.pow(+m[1], +m[2])}`);
    m = t.match(/Evaluate: \((\d+)\/(\d+)\)\^-(\d+)/);
    if (m) return near(val(qd.a), Math.pow(+m[2] / +m[1], +m[3]), 1e-9);
    m = t.match(/Write as an ordinary number: ([\d.]+) × 10\^(\d+) = \?/);
    ok(m, 'unrecognized');
    return near(val(qd.a), +m[1] * Math.pow(10, +m[2]), 1e-9);
  },

  g8_mensuration(qd) {
    const t = clean(qd.q);
    let m = t.match(/parallel sides (\d+) cm and (\d+) cm, and height (\d+) cm\. Find its AREA/);
    if (m) { const exp = (+m[1] + +m[2]) / 2 * +m[3]; ok(Number.isInteger(exp), 'area not integer'); return eq(qd.a, String(exp)); }
    m = t.match(/radius (\d+) cm and height (\d+) cm\. Find its VOLUME using π = 22\/7/);
    if (m) { const v = 22 * +m[1] * +m[1] * +m[2] / 7; ok(Number.isInteger(v), 'volume not integer'); return eq(qd.a, String(v)); }
    m = t.match(/edge (\d+) cm\. Find its TOTAL SURFACE AREA/);
    ok(m, 'unrecognized');
    return eq(qd.a, String(6 * (+m[1]) ** 2));
  },

  g8_factor(qd) {
    const t = clean(qd.q);
    let m = t.match(/Factorise completely: x² - (\d+)/);
    if (m) {
      const k = Math.sqrt(+m[1]);
      ok(Number.isInteger(k), `${m[1]} is not a perfect square`);
      return eq(qd.a, `(x \u2212 ${k})(x + ${k})`, 'difference of squares');
    }
    m = t.match(/Take out the common factor: (\d+)x \+ (\d+) = \?/);
    if (m) {
      const mm = qd.a.match(/^(\d+)\((\d+)x \+ (\d+)\)$/);
      ok(mm, 'answer format k(ax + b), got ' + qd.a);
      return ok(+mm[1] * +mm[2] === +m[1] && +mm[1] * +mm[3] === +m[2], `expansion of "${qd.a}" != ${m[1]}x + ${m[2]}`);
    }
    m = t.match(/Take out the common factor: (\d+)x² \+ (\d+)x = \?/);
    ok(m, 'unrecognized');
    const mm = qd.a.match(/^(\d+)x\((\d+)x \+ (\d+)\)$/);
    ok(mm, 'answer format kx(ax + b), got ' + qd.a);
    return ok(+mm[1] * +mm[2] === +m[1] && +mm[1] * +mm[3] === +m[2], `expansion of "${qd.a}" != ${m[1]}x² + ${m[2]}x`);
  }
};

/* every topic must have a verifier */
for (const g of [5, 6, 7, 8]) for (const topic of BANK[g]) {
  T(`verifier exists: g${g} ${topic.name}`, () => ok(typeof VERIFIERS[topic.gen.name] === 'function', 'missing verifier for ' + topic.gen.name));
}

/* run every generator through structural + math checks */
const RUNS = 400;
for (const g of [5, 6, 7, 8]) for (const topic of BANK[g]) {
  T(`generate+verify ×${RUNS}: grade ${g} — ${topic.name}`, () => {
    const seen = new Set();
    for (let i = 0; i < RUNS; i++) {
      const qd = drawQuestion(topic.gen, seen, (i % 5) + 1);
      /* structural */
      ok(qd.q && qd.q.length > 5, 'question too short');
      ok(!/undefined|NaN/.test(qd.q), 'question contains undefined/NaN: ' + qd.q);
      ok(qd.a !== undefined && qd.a !== null && String(qd.a).length > 0, 'missing answer for: ' + qd.q);
      ok(!/undefined|NaN/.test(String(qd.a)), 'answer contains undefined/NaN');
      ok(qd.hint && qd.hint.length > 5, 'missing hint for: ' + qd.q);
      if (qd.svg) ok((qd.svg.match(/<svg/g) || []).length === (qd.svg.match(/<\/svg>/g) || []).length, 'unbalanced svg');
      if (qd.choices) {
        ok(qd.choices.length >= 2 && qd.choices.length <= 4, 'choices count out of range');
        ok(new Set(qd.choices.map(String)).size === qd.choices.length, 'duplicate choices: ' + qd.choices);
        ok(qd.choices.map(String).includes(String(qd.a)), `answer "${qd.a}" not among choices [${qd.choices}]`);
      }
      /* math — independent recomputation from the question text */
      VERIFIERS[topic.gen.name](qd);
    }
  });
}

/* an island's 5 questions must never repeat */
for (const g of [5, 6, 7, 8]) for (const topic of BANK[g]) {
  T(`island uniqueness: g${g} ${topic.name} (100 islands)`, () => {
    for (let trial = 0; trial < 100; trial++) {
      const seen = new Set();
      for (let k = 0; k < 5; k++) drawQuestion(topic.gen, seen, k + 1);
      ok(seen.size === 5, `only ${seen.size}/5 unique in trial ${trial}`);
    }
  });
}

/* sanity: known-good spot checks (regression guard for the place-value bug) */
T('spot: place value is computed from the correct side', () => {
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const qd = drawQuestion(Q.g5_numbers, seen, 1);
    const m = clean(qd.q).match(/^In the number ([\d,]+), what is the place value of the digit (\d)\?$/);
    if (!m) continue;
    const digits = String(N(m[1]));
    const idx = digits.indexOf(m[2]);
    // the LEFTMOST digit (index 0) must be worth the largest place
    ok(+qd.a === +m[2] * Math.pow(10, digits.length - 1 - idx), `place value wrong for ${m[1]}, digit ${m[2]}`);
    if (idx === 0) ok(+qd.a >= 10000, 'leftmost digit of a 5-digit number must be ≥ 10000');
  }
});

/* ── report ── */
console.log('────────────────────────────────────────');
console.log(`  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log('────────────────────────────────────────');
  failures.forEach(f => console.log(f));
  process.exit(1);
}
console.log('  ALL TESTS PASS ✅');
console.log('────────────────────────────────────────');
