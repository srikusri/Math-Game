/* ═══════════════════════════════════════════════════════════
   game.js — game engine: screens, map, quiz, coins, saving
   ═══════════════════════════════════════════════════════════ */

const SAVE_KEY = 'cbse-math-treasure-v1';
const QUIZ_LEN = 5;

/* ── persistent save ── */
const Save = {
  data: { sound: true, grades: {} },
  load() {
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* fresh start */ }
    return this.data;
  },
  write() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); },
  grade(g) {
    if (!this.data.grades[g]) this.data.grades[g] = { coins: 0, done: [] };
    return this.data.grades[g];
  },
  addCoins(g, n) { const gr = this.grade(g); gr.coins += n; this.write(); renderCoins(); },
  markDone(g, idx) { const gr = this.grade(g); if (!gr.done.includes(idx)) { gr.done.push(idx); this.write(); } },
  reset() { this.data = { sound: this.data.sound, grades: {} }; this.write(); }
};

/* ── tiny sound engine (WebAudio, no files) ── */
const Sfx = {
  ctx: null,
  play(kind) {
    if (!Save.data.sound) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx, t = c.currentTime;
      const notes = {
        correct: [[523, 0], [659, .09], [784, .18]],
        wrong: [[196, 0], [147, .12]],
        coin: [[880, 0], [1319, .08]],
        open: [[392, 0], [523, .1], [659, .2], [784, .3], [1047, .42]],
        click: [[440, 0]]
      }[kind] || [[440, 0]];
      notes.forEach(([f, dt]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = kind === 'wrong' ? 'sawtooth' : 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(.18, t + dt);
        g.gain.exponentialRampToValueAtTime(.001, t + dt + .25);
        o.connect(g); g.connect(c.destination);
        o.start(t + dt); o.stop(t + dt + .3);
      });
    } catch (e) { /* sound is optional */ }
  }
};

/* ── answer checking lives in answers.js (normAns / toNum / sameAnswer) ── */

/* ── screen helpers ── */
const $ = id => document.getElementById(id);
function showScreen(name) {
  ['home', 'map', 'quiz', 'victory'].forEach(s => $(`screen-${s}`).classList.toggle('hidden', s !== name));
  $('topbar').classList.toggle('hidden', false);
  $('btn-home').style.visibility = name === 'home' ? 'hidden' : 'visible';
  window.scrollTo(0, 0);
}
function renderCoins() {
  $('coin-value').textContent = Game.grade ? Save.grade(Game.grade).coins : Save.data.grades[Game.grade]?.coins || 0;
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.add('hidden'), 1800);
}
function floatCoins(txt = '+10') {
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = `🪙 ${txt}`;
  el.style.left = (40 + Math.random() * 20) + '%';
  el.style.top = '30%';
  $('screen-quiz').appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
function sparkleBurst(n = 8) {
  const chars = ['✨', '💎', '🪙', '⭐', '💛'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.textContent = R.pick(chars);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = (2.5 + Math.random() * 1.5) + 's';
    s.style.fontSize = (0.9 + Math.random() * 0.8) + 'rem';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4600);
  }
}

/* ══════════════ GAME STATE ══════════════ */
const Game = {
  grade: null,
  islandIdx: null,
  seen: new Set(),
  qIndex: 0,
  current: null,
  tries: 0,
  streak: 0,
  earnedThisIsland: 0,

  startGrade(g) {
    this.grade = g;
    renderCoins();
    this.renderMap();
    showScreen('map');
    Sfx.play('click');
  },

  renderMap() {
    const topics = BANK[this.grade];
    const gr = Save.grade(this.grade);
    $('map-title').textContent = `Grade ${this.grade} — Choose an Island`;
    $('map-sub').textContent = gr.done.length === topics.length
      ? 'You cleared every island, Captain! Sail again any time — new questions await!'
      : `Cleared ${gr.done.length} of ${topics.length} islands. Hover an island to make it wobble, click to set sail!`;

    const list = topics.map((t, i) => {
      const locked = i > 0 && !gr.done.includes(i - 1);
      const done = gr.done.includes(i);
      const status = locked
        ? '<div class="island-status lockedb">🔒 Locked</div>'
        : done
          ? '<div class="island-status done">✅ Cleared</div>'
          : '<div class="island-status sail">⛵ Set Sail!</div>';
      const blurb = locked
        ? 'Clear the previous island to unlock this one.'
        : done
          ? 'Cleared! Replay it — the questions will all be new.'
          : '5 fresh questions · earn up to 🪙 50 + streak bonuses';
      return `
        <div class="island-card ${locked ? 'locked' : ''}" data-idx="${i}" role="button" tabindex="${locked ? -1 : 0}">
          <div class="island-num">${i + 1}</div>
          <div class="island-emoji">${t.emoji}</div>
          <div class="island-info">
            <h3>${t.name}</h3>
            <p>${blurb}</p>
          </div>
          ${status}
        </div>`;
    }).join('');

    $('map-wrap').innerHTML = `<div class="island-list">${list}</div>`;

    $('map-wrap').querySelectorAll('.island-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const idx = +cardEl.dataset.idx;
        const locked = idx > 0 && !Save.grade(this.grade).done.includes(idx - 1);
        if (locked) { toast('🔒 Clear the previous island first!'); Sfx.play('wrong'); return; }
        this.startIsland(idx);
      });
      cardEl.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !cardEl.classList.contains('locked')) {
          e.preventDefault();
          this.startIsland(+cardEl.dataset.idx);
        }
      });
    });
  },

  startIsland(idx) {
    this.islandIdx = idx;
    this.seen = new Set();
    this.qIndex = 0;
    this.streak = 0;
    this.earnedThisIsland = 0;
    showScreen('quiz');
    $('quiz-topic').textContent = `${BANK[this.grade][idx].emoji} ${BANK[this.grade][idx].name}`;
    $('buddy-art').innerHTML = ART.parrot();
    this.nextQuestion();
    Sfx.play('click');
  },

  nextQuestion() {
    this.qIndex++;
    this.tries = 0;
    const topic = BANK[this.grade][this.islandIdx];
    const q = drawQuestion(topic.gen, this.seen, this.qIndex);
    this.current = q;

    const progress = ((this.qIndex - 1) / QUIZ_LEN) * 100;
    $('progress-fill').style.width = progress + '%';
    $('chest-count').textContent = `${this.qIndex - 1} / ${QUIZ_LEN}`;
    $('chest-art').innerHTML = ART.chest(this.qIndex - 1 >= QUIZ_LEN);

    $('q-art').innerHTML = q.svg || '';
    $('q-text').textContent = q.q;
    $('q-feedback').textContent = '';
    $('q-feedback').className = 'q-feedback';
    $('btn-hint').classList.remove('hidden');
    $('btn-reveal').classList.add('hidden');
    $('btn-next').classList.add('hidden');
    $('buddy-say').textContent = R.pick([
      'Ready the cannons… I mean, your brain! 🧠',
      'X marks the spot… somewhere! 🗺️',
      'You’ve got this, matey! ⚓',
      'Shiver me timbers, a fresh question! 🦜',
      'Think like a captain! 🧭'
    ]);

    if (q.choices) {
      $('q-choices').classList.remove('hidden');
      $('q-input-row').classList.add('hidden');
      const box = $('q-choices');
      box.innerHTML = '';
      R.shuffle(q.choices).forEach(c => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.textContent = c;
        b.addEventListener('click', () => this.checkAnswer(c, b));
        box.appendChild(b);
      });
    } else {
      $('q-choices').classList.add('hidden');
      $('q-input-row').classList.remove('hidden');
      const inp = $('q-input');
      inp.value = '';
      inp.disabled = false;
      setTimeout(() => inp.focus(), 60);
    }
  },

  checkAnswer(userVal, btnEl) {
    const q = this.current;
    const ok = sameAnswer(userVal, q.a);
    const fb = $('q-feedback');

    if (ok) {
      const gain = this.tries === 0 ? 10 : 5;
      this.tries = Math.max(this.tries, 1);
      let bonus = 0;
      if (this.tries === 1 && ++this.streak >= 3) { bonus = 5; this.streak = 0; toast('🔥 Streak bonus +5!'); }
      Save.addCoins(this.grade, gain + bonus);
      this.earnedThisIsland += gain + bonus;
      if (this.tries === 1) this.tries = 1;

      fb.textContent = R.pick(['✅ Shiver me timbers — correct!', '🎉 Aye! Treasure secured!', '⭐ Sharp as a cutlass!', '💎 Brilliant, Captain!']);
      fb.className = 'q-feedback good';
      if (btnEl) btnEl.classList.add('correct');
      $('buddy-say').textContent = R.pick(['Squawk! Well done! 🦜', 'That’s treasure-worthy math! 💰', 'Onward to the chest! ⚓']);
      this.lockInput(btnEl);
      Sfx.play('correct');
      floatCoins(`+${gain + bonus}`);
      this.qIndex >= QUIZ_LEN ? setTimeout(() => this.finishIsland(), 1100) : setTimeout(() => this.nextQuestion(), 1300);
    } else {
      this.tries++;
      this.streak = 0;
      fb.className = 'q-feedback bad';
      fb.textContent = this.tries === 1
        ? '❌ Not quite, matey! Try once more — a hint is waiting below.'
        : '❌ Still not it. Study the hint, or peek at the answer below.';
      if (btnEl) { btnEl.classList.add('wrong'); setTimeout(() => btnEl.classList.remove('wrong'), 450); }
      else { $('q-input').classList.add('shake'); setTimeout(() => $('q-input').classList.remove('shake'), 450); }
      $('btn-hint').classList.remove('hidden');
      if (this.tries >= 2) $('btn-reveal').classList.remove('hidden');
      $('buddy-say').textContent = R.pick(['Squawk! Try again! 🦜', 'Nearly there — check the hint! 💡', 'Even captains miss sometimes! ⚓']);
      Sfx.play('wrong');
    }
  },

  lockInput(chosenBtn) {
    document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; if (b !== chosenBtn && normAns(b.textContent) === normAns(this.current.a)) b.classList.add('correct'); });
    $('q-input').disabled = true;
    $('btn-submit').disabled = false;
    $('btn-next').classList.remove('hidden');
    if (this.qIndex >= QUIZ_LEN) $('btn-next').textContent = 'Open the Chest! 🎁';
    else $('btn-next').textContent = 'Next ➡️';
  },

  submit() {
    const inp = $('q-input');
    if (!inp.value.trim()) { inp.focus(); return; }
    this.checkAnswer(inp.value, null);
  },

  reveal() {
    const q = this.current;
    $('q-feedback').textContent = `🔓 The answer was: ${q.a}`;
    $('q-feedback').className = 'q-feedback info';
    this.lockInput(null);
    this.tries = 2;
    $('btn-next').classList.remove('hidden');
  },

  showHint() {
    const fb = $('q-feedback');
    fb.textContent = `💡 ${this.current.hint}`;
    fb.className = 'q-feedback info';
    $('buddy-say').textContent = 'Squawk! Use the hint, then sketch it in your pad! ✏️';
  },

  finishIsland() {
    if (this.finished) return;
    this.finished = true;
    setTimeout(() => { this.finished = false; }, 500);
    Save.markDone(this.grade, this.islandIdx);
    const gr = Save.grade(this.grade);
    const allDone = gr.done.length >= BANK[this.grade].length;
    $('chest-overlay-art').innerHTML = ART.chest(true);
    $('chest-overlay-title').textContent = allDone ? 'GRAND TREASURE UNLOCKED! 🏆' : 'Island Cleared! 🏝️';
    $('chest-overlay-text').textContent = allDone
      ? `You conquered ALL islands of Grade ${this.grade} and earned ${this.earnedThisIsland} coins this voyage!`
      : `You earned ${this.earnedThisIsland} coins on this island. ${BANK[this.grade].length - gr.done.length} island(s) left!`;
    $('chest-overlay').classList.remove('hidden');
    $('progress-fill').style.width = '100%';
    $('chest-count').textContent = `${QUIZ_LEN} / ${QUIZ_LEN}`;
    $('chest-art').innerHTML = ART.chest(true);
    Sfx.play('open');
    sparkleBurst(allDone ? 12 : 6);
  },

  closeChest() {
    $('chest-overlay').classList.add('hidden');
    const gr = Save.grade(this.grade);
    if (gr.done.length >= BANK[this.grade].length) {
      $('victory-art').innerHTML = ART.treasure();
      $('victory-text').textContent = `Grade ${this.grade} conquered! Every island cleared, every chest opened. The seven seas of math are yours, Captain!`;
      $('victory-coins').textContent = `🪙 ${gr.coins} coins collected`;
      showScreen('victory');
      sparkleBurst(14);
      Sfx.play('open');
    } else {
      this.renderMap();
      showScreen('map');
    }
  },

  renderHome() {
    const grades = [5, 6, 7, 8];
    const box = $('grade-cards');
    box.innerHTML = '';
    grades.forEach(g => {
      const gr = Save.grade(g);
      const card = document.createElement('div');
      card.className = 'grade-card';
      card.innerHTML = `
        <span class="grade-emoji">${['⛵', '🚤', '🛥️', '🚢'][g - 5]}</span>
        <h3>Grade ${g}</h3>
        <p>${BANK[g].map(t => t.emoji).join(' ')}<br>${gr.done.length}/6 islands cleared · 🪙 ${gr.coins}</p>
        ${gr.done.length === 6 ? '<span class="grade-badge">🏆 DONE</span>' : ''}`;
      card.addEventListener('click', () => this.startGrade(g));
      box.appendChild(card);
    });
    $('home-art').innerHTML = ART.hero();
  },

  goHome() {
    this.renderHome();
    renderCoins();
    showScreen('home');
  }
};

/* ══════════════ BOOT ══════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Save.load();
  Game.renderHome();
  showScreen('home');

  $('btn-home').addEventListener('click', () => Game.goHome());
  $('btn-submit').addEventListener('click', () => Game.submit());
  $('q-input').addEventListener('keydown', e => { if (e.key === 'Enter') Game.submit(); });
  $('btn-hint').addEventListener('click', () => Game.showHint());
  $('btn-reveal').addEventListener('click', () => Game.reveal());
  $('btn-next').addEventListener('click', () => {
    if (Game.qIndex >= QUIZ_LEN) Game.finishIsland();
    else Game.nextQuestion();
  });
  $('btn-quiz-quit').addEventListener('click', () => { Game.renderMap(); showScreen('map'); });
  $('btn-chest-ok').addEventListener('click', () => Game.closeChest());
  $('btn-victory-map').addEventListener('click', () => { Game.renderMap(); showScreen('map'); });
  $('btn-victory-home').addEventListener('click', () => Game.goHome());

  $('btn-doodle').addEventListener('click', () => Doodle.open());
  $('btn-quiz-doodle').addEventListener('click', () => Doodle.open());
  $('doodle-close').addEventListener('click', () => Doodle.close());

  $('btn-howto').addEventListener('click', () => $('howto-overlay').classList.remove('hidden'));
  $('btn-howto-ok').addEventListener('click', () => $('howto-overlay').classList.add('hidden'));

  $('btn-reset').addEventListener('click', () => {
    Save.reset();
    Game.goHome();
    toast('🗑️ Progress reset. Fresh seas ahead!');
  });

  $('btn-sound').addEventListener('click', () => {
    Save.data.sound = !Save.data.sound;
    Save.write();
    $('btn-sound').textContent = Save.data.sound ? '🔊' : '🔇';
    if (Save.data.sound) Sfx.play('coin');
  });
  $('btn-sound').textContent = Save.data.sound ? '🔊' : '🔇';

  // close overlays by clicking the dark backdrop
  [['chest-overlay'], ['howto-overlay']].forEach(([id]) =>
    $(id).addEventListener('click', e => {
      if (e.target.id === id && id !== 'chest-overlay') $(id).classList.add('hidden');
    }));
  $('doodle-modal').addEventListener('click', e => { if (e.target.id === 'doodle-modal') Doodle.close(); });
});
