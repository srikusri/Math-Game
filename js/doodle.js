/* ═══════════════════════════════════════════════════════════
   doodle.js — Captain's Sketch Pad
   A freehand SVG drawing tool: pen, eraser, line, box, circle,
   stickers, undo, clear and save-as-SVG. Kids can sketch rough
   work (number lines, shapes, diagrams) for any question.
   ═══════════════════════════════════════════════════════════ */

const Doodle = (() => {
  const STAMPS = ['💎', '🪙', '⭐', '🗝️', '🏴‍☠️', '⚓', '🔑', '❤️'];
  let tool = 'pen', color = '#1f2a44', width = 4;
  let ink = null, canvas = null, drawing = null, startPt = null;

  function svgPoint(evt) {
    const pt = canvas.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(canvas.getScreenCTM().inverse());
  }

  function build() {
    canvas = document.getElementById('doodle-canvas');
    ink = document.getElementById('doodle-ink');
    if (canvas.dataset.built) return;
    canvas.dataset.built = '1';

    // faint grid so it feels like graph paper
    let grid = '';
    for (let x = 40; x < 800; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="480"/>`;
    for (let y = 40; y < 480; y += 40) grid += `<line x1="0" y1="${y}" x2="800" y2="${y}"/>`;
    document.getElementById('doodle-grid').innerHTML =
      grid.replace(/<line /g, '<line stroke="#e8ddc0" stroke-width="1" ');

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);

    document.querySelectorAll('#doodle-tools-btns .tool').forEach(b =>
      b.addEventListener('click', () => {
        tool = b.dataset.tool;
        document.querySelectorAll('#doodle-tools-btns .tool').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      }));

    document.querySelectorAll('#doodle-colors .swatch').forEach(s =>
      s.addEventListener('click', () => {
        color = s.dataset.color;
        document.querySelectorAll('#doodle-colors .swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
      }));

    document.getElementById('doodle-width').addEventListener('input', e => { width = +e.target.value; });
    document.getElementById('doodle-undo').addEventListener('click', () => { if (ink.lastChild) ink.lastChild.remove(); });
    document.getElementById('doodle-clear').addEventListener('click', () => { ink.innerHTML = ''; });
    document.getElementById('doodle-save').addEventListener('click', save);
  }

  function onDown(e) {
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);
    const p = svgPoint(e);
    startPt = p;
    if (tool === 'pen' || tool === 'eraser') {
      drawing = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      drawing.setAttribute('d', `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
      drawing.setAttribute('fill', 'none');
      drawing.setAttribute('stroke', tool === 'eraser' ? '#fffdf5' : color);
      drawing.setAttribute('stroke-width', tool === 'eraser' ? width * 3 : width);
      drawing.setAttribute('stroke-linecap', 'round');
      drawing.setAttribute('stroke-linejoin', 'round');
      ink.appendChild(drawing);
    } else if (tool === 'line') {
      drawing = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      drawing.setAttribute('x1', p.x); drawing.setAttribute('y1', p.y);
      drawing.setAttribute('x2', p.x); drawing.setAttribute('y2', p.y);
      drawing.setAttribute('stroke', color); drawing.setAttribute('stroke-width', width);
      drawing.setAttribute('stroke-linecap', 'round');
      ink.appendChild(drawing);
    } else if (tool === 'rect' || tool === 'circle') {
      drawing = document.createElementNS('http://www.w3.org/2000/svg', tool === 'rect' ? 'rect' : 'circle');
      drawing.setAttribute('fill', 'none');
      drawing.setAttribute('stroke', color);
      drawing.setAttribute('stroke-width', width);
      if (tool === 'rect') { drawing.setAttribute('x', p.x); drawing.setAttribute('y', p.y); drawing.setAttribute('width', 0); drawing.setAttribute('height', 0); }
      else { drawing.setAttribute('cx', p.x); drawing.setAttribute('cy', p.y); drawing.setAttribute('r', 0); }
      ink.appendChild(drawing);
    } else if (tool === 'stamp') {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', p.x - 18); t.setAttribute('y', p.y + 18);
      t.setAttribute('font-size', '36');
      t.textContent = R.pick(STAMPS);
      ink.appendChild(t);
    }
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = svgPoint(e);
    if (tool === 'pen' || tool === 'eraser') {
      drawing.setAttribute('d', drawing.getAttribute('d') + ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    } else if (tool === 'line') {
      drawing.setAttribute('x2', p.x); drawing.setAttribute('y2', p.y);
    } else if (tool === 'rect') {
      drawing.setAttribute('x', Math.min(startPt.x, p.x));
      drawing.setAttribute('y', Math.min(startPt.y, p.y));
      drawing.setAttribute('width', Math.abs(p.x - startPt.x));
      drawing.setAttribute('height', Math.abs(p.y - startPt.y));
    } else if (tool === 'circle') {
      drawing.setAttribute('r', Math.hypot(p.x - startPt.x, p.y - startPt.y));
    }
  }

  function onUp() {
    // drop accidental zero-size shapes
    if (drawing && drawing.tagName === 'circle' && drawing.getAttribute('r') === '0') drawing.remove();
    drawing = null; startPt = null;
  }

  function save() {
    const clone = canvas.cloneNode(true);
    clone.removeAttribute('id');
    const blob = new Blob(['<?xml version="1.0"?>\n' + clone.outerHTML], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'treasure-sketch.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function open() {
    build();
    document.getElementById('doodle-modal').classList.remove('hidden');
  }
  function close() { document.getElementById('doodle-modal').classList.add('hidden'); }
  function isOpen() { return !document.getElementById('doodle-modal').classList.contains('hidden'); }

  return { open, close, isOpen };
})();
