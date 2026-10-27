import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// These inspect drawing commands, not screenshots or a browser acceptance result.
const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const start = source.indexOf('function drawScene(t, dt) {');
const end = source.indexOf('  const ground=h*.79;', start);
const background = source.slice(start, end) + '\n}';
const primitives = source.slice(source.indexOf('function rect('), source.indexOf('function drawHero('));
const plain = value => JSON.parse(JSON.stringify(value));
function draw({ width = 320, height = 160, time = 0, reducedMotion = false } = {}) {
  const trace = [];
  const ctx = { fillStyle: null };
  for (const op of ['fillRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill']) {
    ctx[op] = (...args) => trace.push({ op, args: plain(args), color: ctx.fillStyle });
  }
  let gradientId = 0;
  ctx.createLinearGradient = (...args) => {
    const id = `gradient-${gradientId++}`;
    trace.push({ op: 'gradient', args, color: id });
    return { id, addColorStop: (...stop) => trace.push({ op: 'stop', args: stop, color: id }) };
  };
  const math = Object.create(Math); math.random = () => assert.fail('decorative forest consumed RNG');
  const prefs = Object.freeze({ reducedMotion });
  runInNewContext(`${primitives}\n${background}\ndrawScene(time, 0);`, { ctx, prefs, sceneWidth: width, sceneHeight: height, time, Math: math });
  return plain(trace);
}

test('woodland background is self-contained and has no access to game or save state', () => {
  assert.doesNotMatch(background, /\b(state|dispatch|localStorage|sessionStorage|random|engine|fetch)\b/);
  assert.ok(draw().length > 200);
  assert.doesNotMatch(background, /Moon, layered fir|Broken pillars/);
});

test('forest commands are deterministic for identical dimensions, time and motion preference', () => {
  assert.deepEqual(draw({ time: 19.8 }), draw({ time: 19.8 }));
  assert.deepEqual(draw({ width: 640, height: 360, time: 43 }), draw({ width: 640, height: 360, time: 43 }));
});

test('reduced motion freezes decorative motes across time', () => {
  assert.deepEqual(draw({ time: 0, reducedMotion: true }), draw({ time: 993, reducedMotion: true }));
});

test('only six dim mote positions animate, not landscape geometry or colors', () => {
  const a = draw({ time: 0 }), b = draw({ time: 2 });
  assert.equal(a.length, b.length);
  const changes = a.map((row, i) => JSON.stringify(row) === JSON.stringify(b[i]) ? null : [row, b[i]]).filter(Boolean);
  assert.ok(changes.length > 0 && changes.length <= 6);
  for (const [before, after] of changes) {
    assert.equal(before.op, 'fillRect'); assert.equal(before.color, '#c5cf9950');
    assert.deepEqual(before.args.slice(1), after.args.slice(1));
    assert.ok(Math.abs(before.args[0] - after.args[0]) <= 4);
  }
});

test('background commands remain finite and bounded at supported and tall logical dimensions', () => {
  for (const [width, height] of [[320, 160], [480, 240], [640, 360], [320, 360], [960, 160]]) {
    for (const row of draw({ width, height, time: 100 })) {
      for (const arg of row.args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg));
      if (['moveTo', 'lineTo'].includes(row.op)) {
        assert.ok(row.args[0] >= 0 && row.args[0] <= width);
        assert.ok(row.args[1] >= 0 && row.args[1] <= height);
      }
      if (row.op === 'fillRect') {
        const [x, y, w, h] = row.args;
        assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0);
        assert.ok(x + w <= width + 1 && y + h <= height + 1);
      }
    }
  }
});

test('opaque stage backdrop and two depth gradients precede sparse foreground details', () => {
  const trace = draw();
  assert.deepEqual(trace.find(row => row.op === 'fillRect').args, [0, 0, 320, 160]);
  assert.equal(trace.filter(row => row.op === 'gradient').length, 2);
  assert.equal(trace.filter(row => row.op === 'fillRect' && row.color === '#c5cf9950').length, 6);
  assert.ok(trace.some(row => row.op === 'fill' && row.color === '#58604c'));
  assert.ok(trace.some(row => row.op === 'fill' && row.color === '#6a6d54'));
});

test('all original character, overlay, chest and animation calls remain after the scenery', () => {
  const rest = source.slice(end, source.indexOf('// One-shot idle adaptation:', end));
  assert.match(rest, /drawHero\(w\*\.28,ground,t\)/);
  assert.match(rest, /drawEnemy\(enemy,/);
  assert.match(rest, /if\(!enemies.length\)/);
  assert.match(rest, /particles=particles.filter/);
  assert.match(rest, /const vignette=ctx.createRadialGradient/);
  assert.doesNotMatch(background, /drawHero|drawEnemy|fillText/);
});
