/* ═══════════════════════════════════════════════════════════
   questions.js — CBSE Grades 5–8 dynamic question generators
   Every generator RETURNS a fresh question object:
     { q, a, hint, choices?, svg? }
   The game never shows the same question text twice.
   ═══════════════════════════════════════════════════════════ */

/* Node (unit-test) support: pull in rng + art when run outside the browser */
if (typeof module !== 'undefined' && module.exports) {
  if (typeof R === 'undefined') Object.assign(globalThis, require('./rng.js'));
  if (typeof ART === 'undefined') globalThis.ART = require('./art.js');
}

/* ───────────────── GRADE 5 ───────────────── */

function g5_numbers(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // rounding
    const n = R.int(1001, 99999), step = R.pick([10, 100, 1000]);
    const ans = Math.round(n / step) * step;
    return { q: `Round ${inFormat(n)} to the nearest ${step}.`, a: String(ans),
      hint: `Look at the digit just right of the ${step} place. 5 or more → round up!` };
  }
  if (v === 1) { // compare (MCQ)
    let a = distinctDigitsNumber(5), b = distinctDigitsNumber(5);
    while (a === b) b = distinctDigitsNumber(5);
    return { q: `Which number is GREATER?`, a: inFormat(Math.max(a, b)), choices: [inFormat(a), inFormat(b)].sort(),
      hint: `Compare digit by digit from the left, starting with the ten-thousands place.` };
  }
  // place value of a digit (digits[0] is the LEFTMOST = ten-thousands)
  const digits = R.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);
  const n = +digits.join('');
  const pos = R.int(0, 4);
  const places = ['ten thousands', 'thousands', 'hundreds', 'tens', 'ones'];
  const ans = digits[pos] * Math.pow(10, 4 - pos);
  return { q: `In the number ${inFormat(n)}, what is the place value of the digit ${digits[pos]}?`,
    a: String(ans), hint: `It sits in the ${places[pos]} place. Place value = digit × ${Math.pow(10, 4 - pos)}.` };
}

function g5_muldiv(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // multiplication
    const a = R.int(12, 99), b = R.int(3, lv >= 3 ? 99 : 9);
    return { q: `A pirate has ${a} treasure bags with ${b} coins in each. How many coins in total?`,
      a: String(a * b), hint: `Multiply: ${a} × ${b}.` };
  }
  if (v === 1) { // exact division
    const b = R.int(3, 12), q2 = R.int(6, lv >= 3 ? 60 : 20);
    return { q: `${b * q2} gold coins are shared equally among ${b} pirates. How many coins does each pirate get?`,
      a: String(q2), hint: `Divide the total by the number of pirates: ${b * q2} ÷ ${b}.` };
  }
  // division with remainder — ask remainder
  const b = R.int(3, 9), q2 = R.int(12, 99), r = R.int(1, b - 1);
  return { q: `Find the REMAINDER when ${b * q2 + r} is divided by ${b}.`,
    a: String(r), hint: `Do the long division — whatever is left over at the end is the remainder.` };
}

function g5_fractions(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // add like fractions
    const d = R.pick([6, 8, 9, 10, 12]);
    const n1 = R.int(1, d - 2), n2 = R.int(1, d - n1);
    const f = reduceFrac(n1 + n2, d);
    return { q: `Add: ${n1}/${d} + ${n2}/${d} = ?  (give the answer like 3/4)`,
      a: fmtFrac(n1 + n2, d), svg: ART.svgPie(d, n1 + n2),
      hint: `Same denominator? Just add the top numbers: ${n1}+${n2} = ${n1 + n2}, keep ${d} at the bottom. Simplify if you can!` };
  }
  if (v === 1) { // simplify
    const f = reduceFrac(R.int(1, 9), R.int(2, 12));
    const k = R.int(2, 5);
    return { q: `Simplify this fraction fully: ${f.n * k}/${f.d * k}  (answer like 3/4)`,
      a: fmtFrac(f.n, f.d),
      hint: `Divide top and bottom by their HCF (${k}).` };
  }
  // compare (MCQ) — same numerator
  const n = R.int(2, 7);
  let d1 = R.int(n + 1, 12), d2 = R.int(n + 1, 12);
  while (d1 === d2) d2 = R.int(n + 1, 12);
  const ans = `${n}/${Math.min(d1, d2)}`;
  return { q: `Which fraction is GREATER?`, a: ans, choices: [`${n}/${d1}`, `${n}/${d2}`].sort(),
    hint: `Same top? Then the SMALLER bottom (denominator) means bigger pieces!` };
}

function g5_decimals(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // add/sub
    const a = (R.int(101, 999) / 10).toFixed(1), b = (R.int(11, 99) / 10).toFixed(1);
    const plus = R.chance(0.5);
    const ans = plus ? (parseFloat(a) + parseFloat(b)).toFixed(1) : (parseFloat(a) - parseFloat(b)).toFixed(1);
    return { q: `A chest holds ${a} kg of gold. The crew ${plus ? 'adds' : 'takes away'} ${b} kg. How many kg of gold are in the chest now? (just the number)`,
      a: String(parseFloat(ans)), hint: `Line up the decimal points, then ${plus ? 'add' : 'subtract'} like whole numbers.` };
  }
  if (v === 1) { // ×10 / ×100 (integer math avoids float noise like 1230.0000000000002)
    const ai = R.int(11, 999), k = R.pick([10, 100]);
    return { q: `What is ${(ai / 10).toFixed(1)} × ${k}? (just the number)`, a: String(ai * k / 10),
      hint: `Multiplying by 10 moves the decimal point 1 step right; by 100, 2 steps right.` };
  }
  // compare decimals (MCQ)
  const a = R.int(1, 9) / 10, b = R.int(1, 99) / 100;
  if (a === b) return g5_decimals(lv);
  const sa = a.toFixed(2), sb = b.toFixed(2);
  return { q: `Which decimal is GREATER?`, a: a > b ? sa : sb, choices: [sa, sb].sort(),
    hint: `Line them up at the decimal point and compare place by place. Trailing zeros help: ${sa} vs ${sb}` };
}

function g5_shapes(lv) {
  const v = R.int(0, 3);
  if (v === 0) { // angle type (MCQ)
    if (R.chance(0.5)) {
      return { q: `What TYPE of angle is shown here?`, a: 'Right angle', choices: ['Acute angle', 'Right angle', 'Obtuse angle'],
        svg: ART.svgRightAngle(), hint: `A perfect corner — exactly 90°!` };
    }
    const degv = R.pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160]);
    const type = degv < 90 ? 'Acute angle' : 'Obtuse angle';
    return { q: `What TYPE of angle is shown here?`, a: type, choices: ['Acute angle', 'Right angle', 'Obtuse angle'],
      svg: ART.svgAngle(degv), hint: `Acute < 90°, right = 90°, obtuse > 90° (but less than 180°). Compare with a corner!` };
  }
  if (v === 1) { // perimeter or area of rectangle / square
    if (R.chance(0.4)) {
      const s = R.int(3, 18), area = R.chance(0.5);
      const thing = R.pick(['treasure chest lid', 'ship window', 'sail patch', 'biscuit tin']);
      return { q: `A SQUARE ${thing} has sides of ${s} cm. What is its ${area ? 'AREA' : 'PERIMETER'}? (in ${area ? 'sq cm' : 'cm'}, just the number)`,
        a: String(area ? s * s : 4 * s),
        hint: area ? `Area of a square = side × side = ${s} × ${s}.` : `Perimeter of a square = 4 × side = 4 × ${s}.` };
    }
    const w = R.int(4, 16), h = R.int(3, 13), area = R.chance(0.5);
    const thing = R.pick(['treasure map', 'piece of sail cloth', 'pirate flag', 'section of the ship deck']);
    return { q: `A rectangular ${thing} measures ${w} cm by ${h} cm. What is its ${area ? 'AREA' : 'PERIMETER'}? (in ${area ? 'sq cm' : 'cm'}, just the number)`,
      a: String(area ? w * h : 2 * (w + h)), svg: area ? ART.svgRect(w, h) : null,
      hint: area ? `Area = length × width = ${w} × ${h}.` : `Perimeter = 2 × (length + width) = 2 × (${w} + ${h}).` };
  }
  if (v === 2) { // polygon names (MCQ)
    const polys = [[3, 'Triangle'], [4, 'Quadrilateral'], [5, 'Pentagon'], [6, 'Hexagon'], [7, 'Heptagon'], [8, 'Octagon']];
    const p = R.pick(polys);
    return { q: `What do we call a flat shape with exactly ${p[0]} sides?`,
      a: p[1], choices: R.shuffle([...polys.filter(x => x[0] !== p[0]).slice(0, 3).map(x => x[1]), p[1]]),
      hint: `“Penta” means 5, “hexa” means 6, “hepta” means 7, “octa” means 8!` };
  }
  // reverse: how many sides does X have? (MCQ)
  const polys = [[3, 'Triangle'], [5, 'Pentagon'], [6, 'Hexagon'], [7, 'Heptagon'], [8, 'Octagon']];
  const p = R.pick(polys);
  return { q: `How many sides does a ${p[1]} have? (just the number)`,
    a: String(p[0]), choices: R.shuffle([3, 4, 5, 6, 7, 8].filter(n => n !== p[0]).slice(0, 3).map(String).concat([String(p[0])])),
    hint: `Greek prefixes: penta=5, hexa=6, hepta=7, octa=8!` };
}

function g5_measure(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // length
    const big = R.pick([1, 2, 3, 5, 8]) + R.pick([0, 0.5]);
    const toM = R.chance(0.5);
    return toM
      ? { q: `A rope is ${inFormat(big * 100)} cm long. How many METRES is that? (just the number)`, a: String(big),
          hint: `100 cm = 1 m, so divide by 100.` }
      : { q: `A treasure chest is ${big} m tall. How many CENTIMETRES is that? (just the number)`, a: String(big * 100),
          hint: `1 m = 100 cm, so multiply by 100.` };
  }
  if (v === 1) { // mass
    const kg = R.int(2, 12);
    return { q: `A chest of spices weighs ${kg} kg. How many GRAMS is that? (just the number)`,
      a: String(kg * 1000),
      hint: `1 kg = 1000 g, so multiply by 1000.` };
  }
  // money
  const cost = R.int(8, 60), n = R.int(3, 12);
  return { q: `One compass costs ₹${cost}. Captain Rani buys ${n} compasses. How much does she pay in total? (just the number, in ₹)`,
    a: String(cost * n), hint: `${cost} × ${n} — multiply!` };
}

/* ───────────────── GRADE 6 ───────────────── */

function g6_integers(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // add/sub signed
    const a = R.int(-30, 30), b = R.nonzero(-30, 30);
    const op = R.chance(0.5) ? '+' : '−';
    const ans = op === '+' ? a + b : a - b;
    return { q: `Simplify: (${a}) ${op} (${b}) = ?`,
      a: String(ans), hint: `A minus next to a minus becomes plus: ${op === '+' ? `(${a}) + (${b})` : `(${a}) − (${b}) = (${a}) + (${-b})`}. Negative numbers go DOWN the number line.` };
  }
  if (v === 1) { // compare (MCQ)
    const nums = R.sample(-20, 20, 4);
    const ans = String(Math.max(...nums));
    return { q: `Which of these integers is the GREATEST?`, a: ans, choices: nums.map(String).sort((x, y) => +x - +y),
      hint: `On a number line, bigger is further RIGHT. Negatives: the one closer to 0 is greater.` };
  }
  // temperature/word
  const morning = R.int(-8, 12), drop = R.int(3, 15);
  return { q: `At sunrise it was ${morning}°C. By noon it rose by ${drop}°C. What is the temperature at noon? (just the number with °C)`,
    a: String(morning + drop), hint: `“Rose by” means add: (${morning}) + ${drop}.` };
}

function g6_fractions(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // add unlike (small dens)
    const d1 = R.int(2, 9), d2 = R.int(2, 9);
    if (lcm(d1, d2) > 40) return g6_fractions(lv);
    const n1 = R.int(1, d1 - (d1 > 1 ? 1 : 0)) || 1, n2 = R.int(1, d2 - (d2 > 1 ? 1 : 0)) || 1;
    const L = lcm(d1, d2);
    return { q: `Add: ${n1}/${d1} + ${n2}/${d2} = ?  (answer like 3/4)`,
      a: fmtFrac(n1 * L / d1 + n2 * L / d2, L),
      hint: `Make denominators equal first! LCM of ${d1} and ${d2} is ${L}. Then add the numerators.` };
  }
  // multiply fraction × whole / fraction
  const a = R.int(1, 8), b = R.int(2, 9), c = R.int(1, 6);
  if (R.chance(0.5)) {
    return { q: `${c} × ${a}/${b} = ?  (answer like 3/4)`, a: fmtFrac(c * a, b),
      hint: `Multiply the whole number with the TOP: ${c} × ${a} = ${c * a}, keep ${b} below. Simplify!` };
  }
  const d = R.int(1, 6);
  return { q: `${a}/${b} × ${c}/${d} = ?  (answer like 3/4)`, a: fmtFrac(a * c, b * d),
    hint: `Top × top, bottom × bottom: (${a}×${c})/(${b}×${d}) = ${a * c}/${b * d}. Simplify!` };
}

function g6_decimals(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // multiply decimals
    const a = R.int(2, 9) + R.pick([0.5, 0.25, 0.2]), b = R.int(2, 9);
    const ans = +(a * b).toFixed(2);
    return { q: `A gem weighs ${a} g. What is the weight of ${b} such gems? (just the number)`,
      a: String(ans), hint: `Multiply as whole numbers (${String(a).replace('.', '')} × ${b}), then put the decimal point back using the total decimal places.` };
  }
  // ÷10/100
  const a = R.int(101, 9999), k = R.pick([10, 100]);
  return { q: `What is ${a} ÷ ${k}? (just the number)`, a: String(a / k),
    hint: `Dividing by 10 moves the decimal point 1 step LEFT; by 100, 2 steps left.` };
}

function g6_ratio(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // simplify ratio
    const k = R.int(2, 9), a = R.int(1, 8) * k, b = R.int(1, 8) * k;
    const g = gcd(a, b);
    return { q: `A treasure is split in the ratio ${a} : ${b}. Simplify this ratio fully. (answer like 2:3)`,
      a: `${a / g}:${b / g}`, hint: `Divide both parts by their HCF (${g}).` };
  }
  if (v === 1) { // share in ratio
    const p1 = R.int(1, 5);
    let p2 = R.int(1, 5);
    while (p2 === p1) p2 = R.int(1, 5);
    const k = R.int(2, 9);
    const total = (p1 + p2) * k;
    return { q: `${total} gold coins are divided between two pirates in the ratio ${p1} : ${p2}. How many coins does the pirate with the LARGER share get? (just the number)`,
      a: String(Math.max(p1, p2) * k), hint: `Total parts = ${p1} + ${p2} = ${p1 + p2}. One part = ${total} ÷ ${p1 + p2} = ${k} coins.` };
  }
  // proportion: A : bb :: cc : X  (A = bb/m, X = cc·m, so A·X = bb·cc)
  const m = R.int(2, 5), bb = m * R.int(2, 6), cc = R.int(2, 9);
  const A = bb / m, X = cc * m;
  return { q: `Find the missing number:  ${A} : ${bb}  ::  ${cc} : ?   (just the number)`,
    a: String(X), hint: `In a proportion, cross-multiply: ${A} × ? = ${bb} × ${cc} = ${bb * cc}. So ? = ${bb * cc} ÷ ${A}.` };
}

function g6_algebra(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // evaluate
    const a = R.int(2, 9), x = R.int(2, 10), b = R.int(1, 20);
    return { q: `If x = ${x}, find the value of ${a}x + ${b}. (just the number)`,
      a: String(a * x + b), hint: `Put ${x} in place of x: ${a} × ${x} + ${b}.` };
  }
  if (v === 1) { // pattern
    const s = R.int(1, 9), d = R.int(2, 9), n = R.int(6, 15);
    const seq = [...Array(5)].map((_, i) => s + i * d).join(', ');
    return { q: `A number pattern starts: ${seq}, …  What is its ${n}th term? (just the number)`,
      a: String(s + (n - 1) * d), hint: `Each jump is +${d}. ${n}th term = first term + ${n - 1} jumps = ${s} + ${n - 1} × ${d}.` };
  }
  // simple one-step equation
  const x = R.int(2, 20), a = R.int(2, 15);
  return { q: `Solve for x:  x + ${a} = ${x + a}   (answer like 5 or x=5)`,
    a: String(x), hint: `Take ${a} away from the right side: ${x + a} − ${a}.` };
}

function g6_geometry(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // triangle angle sum
    const a = R.int(30, 80), b = R.int(30, 170 - a < 30 ? 50 : 170 - a);
    const c = 180 - a - b;
    if (c <= 0) return g6_geometry(lv);
    return { q: `Two angles of this triangle are ${a}° and ${b}°. Find the third angle (marked ?). (just the number with °)`,
      a: String(c), svg: ART.svgTriangle(a, b),
      hint: `Angles of a triangle always add to 180°. So ? = 180 − ${a} − ${b}.` };
  }
  // complementary / supplementary
  const comp = R.chance(0.5);
  const a = R.int(15, comp ? 75 : 165);
  return { q: `An angle measures ${a}°. What is its ${comp ? 'COMPLEMENTARY' : 'SUPPLEMENTARY'} angle? (just the number with °)`,
    a: String((comp ? 90 : 180) - a),
    hint: comp ? `Complementary angles add to 90°: 90 − ${a}.` : `Supplementary angles add to 180°: 180 − ${a}.` };
}

/* ───────────────── GRADE 7 ───────────────── */

function g7_integers(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // ×/÷ signed
    const a = R.nonzero(-12, 12), b = R.nonzero(-9, 9);
    if (R.chance(0.5)) {
      return { q: `Multiply: (${a}) × (${b}) = ?`, a: String(a * b),
        hint: `Same signs → positive answer. Different signs → negative answer.` };
    }
    const prod = a * b;
    return { q: `Divide: (${prod}) ÷ (${b}) = ?`, a: String(a),
      hint: `Same signs → positive; different signs → negative. ${prod} ÷ ${Math.abs(b)} = ${Math.abs(a)}.` };
  }
  // order of operations
  const a = R.int(2, 12), b = R.int(2, 12), c = R.int(2, 6), d = R.int(2, 9);
  if (b % c !== 0) return g7_integers(lv);
  return { q: `Simplify: ${a} + ${b} ÷ ${c} × ${d}   (BODMAS! just the number)`,
    a: String(a + (b / c) * d), hint: `Division and multiplication first (left to right): ${b} ÷ ${c} = ${b / c}, then × ${d} = ${(b / c) * d}. Then add ${a}.` };
}

function g7_equations(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // ax + b = c
    const x = R.int(2, 12), a = R.int(2, 9), b = R.nonzero(-15, 15);
    const c = a * x + b;
    return { q: `Solve for x:  ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${c}   (answer like 5 or x=5)`,
      a: String(x), hint: `First move ${Math.abs(b)} to the right: ${a}x = ${c} ${b >= 0 ? '−' : '+'} ${Math.abs(b)} = ${c - b}. Then divide by ${a}.` };
  }
  if (v === 1) { // x/a = b
    const x = R.int(4, 30), a = R.int(2, 8);
    if (x % a !== 0) return g7_equations(lv);
    return { q: `Solve for x:  x/${a} = ${x / a}   (answer like 12 or x=12)`,
      a: String(x), hint: `Multiply both sides by ${a}.` };
  }
  // word problem
  const n = R.int(3, 9), extra = R.int(5, 30), each = R.int(4, 12);
  return { q: `A pirate buys ${n} spyglasses and a map for ${extra} coins. She pays ${n * each + extra} coins in all. What is the price of ONE spyglass? (just the number)`,
    a: String(each), hint: `Equation: ${n}x + ${extra} = ${n * each + extra}. Subtract ${extra}, then divide by ${n}.` };
}

function g7_percent(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // percent of number
    const p = R.pick([10, 20, 25, 50, 75]);
    const n = p === 10 ? R.multipleOf(10, 40, 400) : p === 20 ? R.multipleOf(5, 40, 300) : R.multipleOf(4, 20, 200);
    return { q: `A chest has ${n} coins. The crew pays ${p}% of them as harbour tax. How many coins is that? (just the number)`,
      a: String(n * p / 100), hint: `${p}% means ${p}/100. So compute ${p}/100 × ${n}. (Tip: 25% = ¼, 50% = ½, 75% = ¾.)` };
  }
  if (v === 1) { // what percent (whole chosen so the head-count is a whole number)
    const need = { 10: 10, 20: 5, 25: 4, 40: 5, 50: 2, 75: 4 };
    const p = R.pick([10, 20, 25, 40, 50, 75]);
    const whole = R.multipleOf(need[p], 20, 200);
    const part = whole * p / 100;
    return { q: `In a class of ${whole} pirates-in-training, ${part} can swim. What PERCENT can swim? (just the number)`,
      a: String(p), hint: `Percent = (part ÷ whole) × 100 = ${part}/${whole} × 100.` };
  }
  // increase/decrease (n divisible by 100 keeps every percent exact)
  const n = R.multipleOf(100, 100, 800), p = R.pick([10, 20, 25, 50]);
  const up = R.chance(0.5);
  return { q: `The price of a treasure map ${up ? 'rose' : 'fell'} from ₹${n} by ${p}%. What is the NEW price? (just the number, in ₹)`,
    a: String(up ? n + n * p / 100 : n - n * p / 100), hint: `Find ${p}% of ${n} first (${n * p / 100}), then ${up ? 'add' : 'subtract'} it.` };
}

function g7_profit_si(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // SI
    const P = R.multipleOf(100, 400, 5000), r = R.int(2, 12), t = R.int(1, 3);
    const si = P * r * t / 100;
    return { q: `Captain deposits ₹${P} in the Pirate Bank at ${r}% per year SIMPLE INTEREST. How much interest after ${t} year${t > 1 ? 's' : ''}? (just the number, in ₹)`,
      a: String(si), hint: `SI = P × R × T ÷ 100 = ${P} × ${r} × ${t} ÷ 100.` };
  }
  // profit/loss %
  const p = R.pick([10, 20, 25, 50]);
  const CP = p === 25 ? R.multipleOf(4, 40, 400) : p === 10 ? R.multipleOf(10, 50, 500) : p === 20 ? R.multipleOf(5, 40, 400) : R.multipleOf(2, 40, 400);
  const loss = R.chance(0.5);
  const SP = loss ? CP - CP * p / 100 : CP + CP * p / 100;
  return { q: `A compass was bought for ₹${CP} and sold for ₹${SP}. Find the ${loss ? 'LOSS' : 'PROFIT'} percent. (just the number)`,
    a: String(p), hint: `${loss ? 'Loss' : 'Profit'} = ₹${Math.abs(SP - CP)}. Percent = (${loss ? 'Loss' : 'Profit'} ÷ CP) × 100 = ${Math.abs(SP - CP)}/${CP} × 100.` };
}

function g7_angles(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // complementary/supplementary
    const comp = R.chance(0.5), a = R.int(15, comp ? 75 : 165);
    return { q: `Two angles are ${comp ? 'complementary' : 'supplementary'}. One angle is ${a}°. Find the other. (just the number with °)`,
      a: String((comp ? 90 : 180) - a), hint: `${comp ? 'Complementary angles add to 90°.' : 'Supplementary angles add to 180°.'}` };
  }
  if (v === 1) { // exterior angle
    const a = R.int(30, 70), b = R.int(30, 70);
    return { q: `Two interior angles of a triangle are ${a}° and ${b}°. What is the EXTERIOR angle next to the third angle? (just the number with °)`,
      a: String(a + b), hint: `Exterior angle = sum of the two opposite interior angles = ${a} + ${b}.` };
  }
  // parallel lines (MCQ)
  const a = R.pick([40, 55, 65, 70, 110, 125]);
  const co = 180 - a;
  return { q: `Two parallel lines are cut by a transversal. One angle is ${a}°. What is the CO-INTERIOR angle on the same side? (just the number with °)`,
    a: String(co), choices: [String(a), String(co), String(90), String(360 - a)].sort((x, y) => x - y),
    hint: `Co-interior angles add up to 180°.` };
}

function g7_exponents(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // evaluate power
    const a = R.pick([2, 3, 4, 5, 6, 10]), b = a === 10 ? R.int(2, 4) : R.int(2, 5);
    return { q: `Evaluate: ${a}^${b}  (that means ${a} to the power ${b}; just the number)`,
      a: String(Math.pow(a, b)), hint: `${a}^${b} = ${Array(b).fill(a).join(' × ')} = ${Math.pow(a, b)}.` };
  }
  if (v === 1) { // product law
    const a = R.pick([2, 3, 5, 7]), m = R.int(3, 12), n = R.int(3, 12);
    return { q: `Fill the blank:  ${a}^${m} × ${a}^${n} = ${a}^?   (just the number)`,
      a: String(m + n), hint: `Same base multiplying → ADD the powers: a^m × a^n = a^(m+n).` };
  }
  // quotient law
  const a = R.pick([2, 3, 5, 7]), m = R.int(6, 15), n = R.int(2, 5);
  return { q: `Fill the blank:  ${a}^${m} ÷ ${a}^${n} = ${a}^?   (just the number)`,
    a: String(m - n), hint: `Same base dividing → SUBTRACT the powers: a^m ÷ a^n = a^(m−n).` };
}

/* ───────────────── GRADE 8 ───────────────── */

function g8_rational(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // add/sub with signs
    const d1 = R.int(2, 8), d2 = R.int(2, 8);
    if (lcm(d1, d2) > 30) return g8_rational(lv);
    const L = lcm(d1, d2);
    const n1 = R.nonzero(-3, 5) || 1, n2 = R.nonzero(-3, 5) || 1;
    const op = R.chance(0.5) ? '+' : '−';
    const num = op === '+' ? n1 * L / d1 + n2 * L / d2 : n1 * L / d1 - n2 * L / d2;
    return { q: `Simplify: (${n1}/${d1}) ${op} (${n2}/${d2}) = ?  (answer like 3/4 or -3/4)`,
      a: fmtFrac(num, L), hint: `LCM of ${d1} and ${d2} is ${L}. Rewrite both with denominator ${L}, then ${op === '+' ? 'add' : 'subtract'}.` };
  }
  // multiply
  const a = R.nonzero(-7, 7) || 2, b = R.int(2, 9), c = R.nonzero(-6, 6) || 3, d = R.int(2, 9);
  return { q: `Multiply: (${a}/${b}) × (${c}/${d}) = ?  (answer like 3/4 or -3/4)`,
    a: fmtFrac(a * c, b * d), hint: `Top × top, bottom × bottom. Mind the signs: negative × negative = positive!` };
}

function g8_linear(lv) {
  const v = R.int(0, 1);
  if (v === 0) { // ax + b = cx + d
    for (let i = 0; i < 30; i++) {
      const x = R.int(2, 9), a = R.int(2, 9), c = R.int(2, 9);
      if (a === c) continue;
      const b = R.int(1, 20), d = b - (c - a) * x;
      if (Math.abs(d) > 40 || d === 0) continue;
      return { q: `Solve for x:  ${a}x + ${b} = ${c}x ${d > 0 ? '+' : '−'} ${Math.abs(d)}   (answer like 4 or x=4)`,
        a: String(x), hint: `Move x terms left, numbers right: ${a}x − ${c}x = ${d > 0 ? '−' : ''}${Math.abs(d)} − ${b}, i.e. ${a - c}x = ${d - b}. Divide to get x.` };
    }
    return g8_linear(lv);
  }
  // with brackets
  const x = R.int(2, 12), a = R.int(2, 6), b = R.int(1, 9), c = a * (x + b);
  return { q: `Solve for x:  ${a}(x + ${b}) = ${c}   (answer like 7 or x=7)`,
    a: String(x), hint: `Divide both sides by ${a} first: x + ${b} = ${c / a}. Then subtract ${b}.` };
}

function g8_roots(lv) {
  const v = R.int(0, 4);
  if (v === 0) { // square root
    const n = R.int(4, 40);
    return { q: `Find the square root:  √${n * n}   (just the number)`,
      a: String(n), hint: `Which number times itself gives ${n * n}? Try ${n} × ${n}.` };
  }
  if (v === 1) { // cube root
    const n = R.int(2, 12);
    return { q: `Find the cube root:  ∛${n * n * n}   (just the number)`,
      a: String(n), hint: `Which number used THREE times in multiplication gives ${n * n * n}?` };
  }
  if (v === 2) { // square it
    const n = R.int(11, 32);
    return { q: `Find the square:  ${n}²   (just the number)`,
      a: String(n * n), hint: `${n}² means ${n} × ${n} = ${n * n}.` };
  }
  if (v === 3) { // cube it
    const n = R.int(2, 10);
    return { q: `Find the cube:  ${n}³   (just the number)`,
      a: String(n * n * n), hint: `${n}³ means ${n} × ${n} × ${n}.` };
  }
  // perfect square check (MCQ)
  const sq = R.int(4, 40) ** 2, not = sq + R.pick([1, 2, 3, -1, -2]);
  const target = R.chance(0.5) ? sq : not;
  const isSq = Number.isInteger(Math.sqrt(target));
  return { q: `Is ${target} a PERFECT SQUARE?`, a: isSq ? 'Yes' : 'No', choices: ['Yes', 'No'],
    hint: `Check numbers near √${target} ≈ ${Math.sqrt(target).toFixed(1)}. A perfect square is a whole number × itself.` };
}

function g8_powers(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // negative exponent
    const a = R.pick([2, 3, 4, 5]), b = R.int(1, 3);
    return { q: `Evaluate: ${a}^−${b}   (give the answer as a fraction, like 3/4)`,
      a: fmtFrac(1, Math.pow(a, b)), hint: `a^−n = 1/a^n. So ${a}^−${b} = 1/${a}^${b} = 1/${Math.pow(a, b)}.` };
  }
  if (v === 1) { // (a/b)^-n
    const a = R.int(2, 5), b = R.int(2, 6), n = R.int(1, 2);
    return { q: `Evaluate: (${a}/${b})^−${n}   (answer like 3/4)`,
      a: fmtFrac(Math.pow(b, n), Math.pow(a, n)), hint: `Flip the fraction and make the power positive: (${b}/${a})^${n}.` };
  }
  // standard form -> ordinary number (integer math keeps the answer clean)
  const m = R.int(11, 99), k = R.int(3, 7);
  return { q: `Write as an ordinary number:  ${(m / 10).toFixed(1)} × 10^${k} = ?  (just the number)`,
    a: String(m * Math.pow(10, k - 1)), hint: `Move the decimal point ${k} places to the right.` };
}

function g8_mensuration(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // trapezium
    const a = R.int(4, 15), h = R.int(3, 12), b = a + R.int(1, 6) * 2;
    return { q: `A trapezium has parallel sides ${a} cm and ${b} cm, and height ${h} cm. Find its AREA in sq cm. (just the number)`,
      a: String((a + b) / 2 * h), hint: `Area = ½ × (sum of parallel sides) × height = ½ × (${a} + ${b}) × ${h}.` };
  }
  if (v === 1) { // cylinder volume with π = 22/7
    const r = R.pick([7, 14]), h = R.int(3, 12);
    const v23 = (22 / 7) * r * r * h;
    return { q: `A treasure barrel is a cylinder with radius ${r} cm and height ${h} cm. Find its VOLUME using π = 22/7, in cubic cm. (just the number)`,
      a: String(v23), hint: `V = πr²h = 22/7 × ${r} × ${r} × ${h}.` };
  }
  // cube surface area
  const a = R.int(2, 12);
  return { q: `A cubic treasure box has edge ${a} cm. Find its TOTAL SURFACE AREA in sq cm. (just the number)`,
    a: String(6 * a * a), hint: `A cube has 6 identical square faces: SA = 6 × edge² = 6 × ${a}².` };
}

function g8_factor(lv) {
  const v = R.int(0, 2);
  if (v === 0) { // difference of squares (MCQ)
    const a = R.int(2, 12);
    const correct = `(x − ${a})(x + ${a})`;
    return { q: `Factorise completely:  x² − ${a * a}`,
      a: correct, choices: R.shuffle([correct, `(x − ${a})(x − ${a})`, `(x + ${a})(x + ${a})`, `(x − ${a * a})(x + 1)`]),
      hint: `a² − b² = (a − b)(a + b). Here b² = ${a * a}, so b = ${a}.` };
  }
  if (v === 1) { // common factor (MCQ)
    const k = R.pick([2, 3, 4, 5, 6]), a = R.int(2, 9), b = R.int(1, 9);
    const correct = `${k}(${a}x + ${b})`;
    const distractors = [`${k}(${a}x − ${b})`, `${a}(${k}x + ${b})`, `x(${k * a} + ${k * b})`]
      .filter(d => d !== correct);
    return { q: `Take out the common factor:  ${k * a}x + ${k * b}  = ?`,
      a: correct, choices: R.shuffle([...distractors.slice(0, 3), correct]),
      hint: `Both terms share ${k}. Pull it outside the bracket: ${k}( … ) — divide each term by ${k}.` };
  }
  // common factor kx(ax + b) (MCQ)
  const k = R.pick([2, 3, 4, 5]), a = R.int(2, 6), b = R.int(1, 9);
  const correct = `${k}x(${a}x + ${b})`;
  const distractors = [`${k}x(${a}x − ${b})`, `${k}(${a}x + ${b})`, `x(${k * a}x + ${k * b})`]
    .filter(d => d !== correct);
  return { q: `Take out the common factor:  ${k * a}x² + ${k * b}x  = ?`,
    a: correct, choices: R.shuffle([...distractors.slice(0, 3), correct]),
    hint: `Both terms share ${k}x. Pull it out: ${k}x( ? ) — divide each term by ${k}x.` };
}

/* ═══════════════ TOPIC BANK ═══════════════
   6 islands (topics) per grade, in sailing order. */

const BANK = {
  5: [
    { name: "Number Map",     emoji: "🗺️", gen: g5_numbers },
    { name: "Multiply Dock",  emoji: "⚓", gen: g5_muldiv },
    { name: "Fraction Cove",  emoji: "🍉", gen: g5_fractions },
    { name: "Decimal Bay",    emoji: "🐚", gen: g5_decimals },
    { name: "Shape Lagoon",   emoji: "📐", gen: g5_shapes },
    { name: "Measure Peak",   emoji: "⛰️", gen: g5_measure }
  ],
  6: [
    { name: "Integer Iceberg",   emoji: "🧊", gen: g6_integers },
    { name: "Fraction Falls",    emoji: "🌊", gen: g6_fractions },
    { name: "Decimal Deck",      emoji: "🪙", gen: g6_decimals },
    { name: "Ratio Reef",        emoji: "🐠", gen: g6_ratio },
    { name: "Algebra Anchorage", emoji: "🗝️", gen: g6_algebra },
    { name: "Geometry Gardens",  emoji: "🔺", gen: g6_geometry }
  ],
  7: [
    { name: "Integer Storm",      emoji: "⛈️", gen: g7_integers },
    { name: "Equation Cove",      emoji: "⚖️", gen: g7_equations },
    { name: "Percent Plateau",    emoji: "💯", gen: g7_percent },
    { name: "Profit & Plunder",   emoji: "💰", gen: g7_profit_si },
    { name: "Angle Atoll",        emoji: "📏", gen: g7_angles },
    { name: "Exponent Expedition",emoji: "⚡", gen: g7_exponents }
  ],
  8: [
    { name: "Rational Rapids",    emoji: "🌀", gen: g8_rational },
    { name: "Linear Lagoon",      emoji: "🧮", gen: g8_linear },
    { name: "Square-Cube Cove",   emoji: "🧊", gen: g8_roots },
    { name: "Power Peak",         emoji: "🌋", gen: g8_powers },
    { name: "Mensuration Meadow", emoji: "🛢️", gen: g8_mensuration },
    { name: "Factor Fortress",    emoji: "🏰", gen: g8_factor }
  ]
};

/* Draw a question, making sure its text hasn't appeared before. */
function drawQuestion(gen, seen, level) {
  for (let i = 0; i < 40; i++) {
    let qd;
    try { qd = gen(level); } catch (e) { continue; }
    if (qd && qd.q && !seen.has(qd.q)) { seen.add(qd.q); return qd; }
  }
  return gen(level); // fallback even if repeated
}

/* Node (unit-test) support */
if (typeof module !== 'undefined' && module.exports) {
  const _m = { BANK, drawQuestion };
  Object.values(BANK).forEach(topics => topics.forEach(t => { _m[t.gen.name] = t.gen; }));
  module.exports = _m;
}
