import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { V, m4, toPose } from './src/kit.js';
import { buildRoom } from './src/room.js';
import diningTable from './src/dining-table.js';
import bookshelf from './src/bookshelf.js';
import bedFrame from './src/bed-frame.js';
import coffeeTable from './src/coffee-table.js';
import sofa from './src/sofa.js';

// ---------------------------------------------------------------------------
// Each furniture module describes its parts, steps and camera views, and builds
// its pieces through addPart(). Parts are modelled in their final, upright
// positions; a part sits at its `layout` pose (on the floor) until its step,
// then animates into its `final` pose.
//
// If a module has `flip`, the whole assembly is built in `flip.build` pose
// (e.g. upside-down on a blanket) and turned to `flip.up` at `flip.step`.
// Parts can be children of other parts (`parent`) so they travel with them,
// e.g. legs screwed into a sofa unit before the unit is turned over.
// ---------------------------------------------------------------------------

const FURNITURE = [diningTable, bookshelf, bedFrame, coffeeTable, sofa];

// ---------------------------------------------------------------- Renderer
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 1, 4000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 40;
controls.maxDistance = 800;

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x8d8a85, 1.3);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e5, 2.2);
sun.position.set(150, 300, 160);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -330, right: 330, top: 330, bottom: -330, near: 10, far: 900 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.4;
scene.add(sun);

const room = buildRoom();
scene.add(room.group);

const dark = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const d = dark.matches;
  scene.background = new THREE.Color(d ? 0x15181d : 0xeef0f2);
  renderer.toneMappingExposure = d ? 0.8 : 1.05;
  sun.intensity = d ? 1.1 : 2.2;
  hemi.intensity = d ? 0.9 : 1.3;
  room.setDark(d);
}
applyTheme();
dark.addEventListener?.('change', applyTheme);

// ---------------------------------------------------------------- Furniture state
const IDENT = { p: V(), q: new THREE.Quaternion() };
let F = null;          // active furniture module
let parts = [];
let hooks = {};
let assembly = null;   // the furniture being built (flips, if the module says so)
let world = null;      // world-space extras and parts fitted after the flip
let LAST = 0;

const buildPose = () => (F.flip ? F.flip.build : IDENT);
const groupPoseAtEnd = s => (F.flip && s >= F.flip.step ? F.flip.up : buildPose());

function addPart(obj, o) {
  const flip = F.flip;
  let container, frame;   // frame: world matrix of the container while the part waits / moves
  if (o.parent) {
    if (o.parent.step <= o.step) throw new Error('A child part must be fitted before its parent moves.');
    container = o.parent.obj;
    frame = o.parent.frame.clone().multiply(m4(o.parent.layout));
  } else if (flip && o.step > flip.step) {
    container = world;
    frame = new THREE.Matrix4();
  } else {
    container = assembly;
    frame = m4(buildPose());
  }
  // Finals of parts fitted after the flip are given in the upright assembly frame
  const final = !o.parent && flip && o.step > flip.step
    ? toPose(m4(flip.up).multiply(m4(o.final)))
    : { p: o.final.p.clone(), q: o.final.q.clone() };
  const frameQ = new THREE.Quaternion();
  frame.decompose(V(), frameQ, V());
  const part = {
    obj, step: o.step, frame,
    layout: toPose(frame.clone().invert().multiply(m4(o.layout))),
    final,
    approach: o.approach || null,     // offset from the final pose, in container space
    spin: o.spin || null,             // { axis (part space), turns }
    delay: o.delay || 0,
    arc: o.arc ?? 30,
    appear: !!o.appear,               // hidden until its step
    highlight: o.highlight !== false,
    up: V(0, 1, 0).applyQuaternion(frameQ.invert()),   // world up, in container space
  };
  obj.traverse(c => { if (c.isMesh) c.userData.baseMat = c.material; });
  container.add(obj);
  parts.push(part);
  return part;
}

function disposeGroup(g) {
  scene.remove(g);
  g.traverse(o => o.geometry?.dispose());
}

function load(f, step = 0) {
  autoplay = false; updatePlayIcon();
  anim = null; glide = null;
  if (assembly) { disposeGroup(assembly); disposeGroup(world); }
  F = f; parts = []; highlighted = [];
  assembly = new THREE.Group(); world = new THREE.Group();
  scene.add(assembly, world);
  hooks = f.build({ addPart, world }) || {};
  LAST = f.steps.length - 1;

  document.title = `${f.title} · 3D Guide`;
  $('brandTitle').textContent = f.title;
  $('brandTag').textContent = f.tagline;
  $('brandIcon').innerHTML = f.icon;
  [...picker.children].forEach(b => {
    const on = b.dataset.id === f.id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  progress.innerHTML = '';
  f.steps.forEach((st, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Step ${i}: ${st.title}`);
    b.title = `${i}. ${st.title}`;
    b.addEventListener('click', () => { setAutoplay(false); goTo(i, false); });
    progress.appendChild(b);
  });

  current = Math.max(0, Math.min(LAST, step));
  snapTo(current);
  camGlide(viewFor(current));
  renderUI();
}

// ---------------------------------------------------------------- Camera
function viewFor(s) {
  const v = F.views[Math.min(s, F.views.length - 1)];
  const aspect = window.innerWidth / window.innerHeight;
  const k = aspect < 1 ? Math.min(2.1, 1.25 / aspect) : 1;
  return { pos: v.target.clone().add(v.pos.clone().sub(v.target).multiplyScalar(k)), target: v.target.clone() };
}

// ---------------------------------------------------------------- Animation
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = t => Math.min(1, Math.max(0, t));
const DUR = 2.6;          // seconds per part move
const tmpQ = new THREE.Quaternion();

function applyPartAnim(part, t) {
  const { obj, layout, final } = part;
  const approachP = part.approach ? final.p.clone().add(part.approach) : final.p.clone();
  let p, q;
  const split = part.approach ? 0.65 : 1;
  if (t < split) {
    const u = ease(t / split);
    p = layout.p.clone().lerp(approachP, u);
    p.addScaledVector(part.up, Math.sin(Math.PI * u) * part.arc);
    q = layout.q.clone().slerp(final.q, u);
  } else {
    const u = ease((t - split) / (1 - split));
    p = approachP.lerp(final.p, u);
    q = final.q.clone();
  }
  if (part.spin && t >= split) {
    const u = (t - split) / (1 - split);
    tmpQ.setFromAxisAngle(part.spin.axis, -(1 - u) * part.spin.turns * Math.PI * 2);
    q = q.clone().multiply(tmpQ);
  }
  obj.position.copy(p);
  obj.quaternion.copy(q);
}

function setGroup(pose) {
  assembly.position.copy(pose.p);
  assembly.quaternion.copy(pose.q);
}

function snapTo(s) {
  parts.forEach(part => {
    const pose = s >= part.step ? part.final : part.layout;
    part.obj.position.copy(pose.p);
    part.obj.quaternion.copy(pose.q);
    part.obj.visible = !part.appear || s >= part.step;
  });
  setGroup(groupPoseAtEnd(s));
  hooks.snap?.(s);
  setHighlight(s, 0);
}

// Highlight parts of the current step with a soft emissive pulse
const highlightColor = new THREE.Color(0x3b82f6);
const materialCache = new Map();
function hlMat(m) {
  if (!materialCache.has(m)) {
    const c = m.clone();
    c.emissive = highlightColor.clone();
    c.emissiveIntensity = 0;
    materialCache.set(m, c);
  }
  return materialCache.get(m);
}
let highlighted = [];
function setHighlight(s, intensity) {
  highlighted.forEach(o => o.traverse(c => { if (c.isMesh) c.material = c.userData.baseMat; }));
  highlighted = [];
  if (intensity <= 0) return;
  parts.filter(p => p.step === s && p.highlight).forEach(p => {
    p.obj.traverse(c => { if (c.isMesh) { const hm = hlMat(c.userData.baseMat); hm.emissiveIntensity = intensity; c.material = hm; } });
    highlighted.push(p.obj);
  });
}

let current = 0;
let anim = null;
const clock = new THREE.Clock();
const partStart = d => 0.35 + d * DUR;
const partLen = DUR * 0.62;

function playStep(s) {
  snapTo(s - 1);
  const stepParts = parts.filter(p => p.step === s);
  stepParts.forEach(p => { p.obj.visible = true; });
  hooks.start?.(s);
  const isFlip = F.flip && s === F.flip.step;
  const partsEnd = Math.max(0, ...stepParts.map(p => partStart(p.delay) + partLen));
  const v = viewFor(s);
  anim = {
    step: s, t: 0, stepParts,
    dur: Math.max(isFlip ? F.flip.dur + 0.6 : DUR + 0.6, partsEnd + 0.3),
    camFromP: camera.position.clone(), camFromT: controls.target.clone(),
    camToP: v.pos, camToT: v.target,
  };
}

function tick(dt) {
  if (!anim) return;
  anim.t += dt;
  const s = anim.step;

  const cu = ease(clamp01(anim.t / 1.4));
  camera.position.lerpVectors(anim.camFromP, anim.camToP, cu);
  controls.target.lerpVectors(anim.camFromT, anim.camToT, cu);

  anim.stepParts.forEach(p => applyPartAnim(p, clamp01((anim.t - partStart(p.delay)) / partLen)));

  let flipU = 0;
  if (F.flip && s === F.flip.step) {
    const { build, up, centre, lift, dur } = F.flip;
    const u = ease(clamp01((anim.t - 0.4) / (dur - 0.4)));
    const q = build.q.clone().slerp(up.q, u);
    const startC = centre.clone().applyQuaternion(build.q).add(build.p);
    const endC = centre.clone().applyQuaternion(up.q).add(up.p);
    const c = startC.lerp(endC, u).add(V(0, Math.sin(Math.PI * u) * lift, 0));
    setGroup({ p: c.sub(centre.clone().applyQuaternion(q)), q });
    flipU = u;
  }
  hooks.tick?.(s, anim.t, flipU);

  const pulse = anim.t < anim.dur ? 0.35 * Math.sin(Math.PI * clamp01(anim.t / anim.dur)) : 0;
  setHighlight(s, pulse);

  if (anim.t >= anim.dur) {
    snapTo(s);
    anim = null;
    onAnimDone();
  }
}

// ---------------------------------------------------------------- UI
const $ = id => document.getElementById(id);
const progress = $('progress');
const picker = $('picker');

const home = document.createElement('a');
home.className = 'chip home';
home.href = '#';
home.innerHTML = '<span aria-hidden="true">←</span> All guides';
picker.appendChild(home);

FURNITURE.forEach(f => {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.id = f.id;
  b.textContent = f.short;
  b.addEventListener('click', () => { if (F !== f) { load(f, 0); syncHash(); } });
  picker.appendChild(b);
});

function syncHash() {
  history.replaceState(null, '', `#${F.id}${current ? `/${current}` : ''}`);
}

function renderUI() {
  const st = F.steps[current];
  $('stepBadge').textContent = current === 0 ? 'Before you start' : `Step ${current}`;
  $('stepCount').textContent = current === 0 ? '' : `of ${LAST}`;
  $('stepTitle').textContent = st.title;
  $('stepDesc').textContent = st.desc;
  const ul = $('stepParts');
  ul.innerHTML = '';
  st.parts.forEach(([k, n]) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="tag">${k}</span><span class="name"></span><span class="qty">×${n}</span>`;
    li.querySelector('.name').textContent = F.parts[k];
    ul.appendChild(li);
  });
  const tip = $('stepTip');
  tip.hidden = !st.tip;
  tip.textContent = st.tip || '';
  [...progress.children].forEach((b, i) => {
    b.classList.toggle('active', i === current);
    b.classList.toggle('done', i < current);
    b.setAttribute('aria-selected', i === current);
  });
  $('prevBtn').disabled = current === 0;
  $('nextBtn').textContent = current === LAST ? 'Start over ↺' : 'Next →';
}

function goTo(s, animate = true) {
  s = Math.max(0, Math.min(LAST, s));
  current = s;
  if (animate && s > 0) {
    playStep(s);
  } else {
    anim = null;
    snapTo(s);
    camGlide(viewFor(s));
  }
  renderUI();
  syncHash();
}

let glide = null;
function camGlide(v) {
  glide = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: v.pos, toT: v.target };
}
function tickGlide(dt) {
  if (!glide) return;
  glide.t += dt;
  const u = ease(clamp01(glide.t / 1.2));
  camera.position.lerpVectors(glide.fromP, glide.toP, u);
  controls.target.lerpVectors(glide.fromT, glide.toT, u);
  if (u >= 1) glide = null;
}

let autoplay = false;
function updatePlayIcon() {
  $('playIcon').innerHTML = autoplay ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  $('playBtn').setAttribute('aria-label', autoplay ? 'Pause auto-play' : 'Auto-play all steps');
}
function setAutoplay(on) {
  autoplay = on;
  updatePlayIcon();
  if (on) {
    if (current === LAST) { goTo(0, false); setTimeout(() => autoplay && goTo(1), 1400); }
    else if (!anim) goTo(current + 1);
  }
}
function onAnimDone() {
  if (autoplay) {
    if (current < LAST) setTimeout(() => autoplay && !anim && goTo(current + 1), 1100);
    else setAutoplay(false);
  }
}

$('nextBtn').addEventListener('click', () => { if (current === LAST) { setAutoplay(false); goTo(0, false); } else goTo(current + 1); });
$('prevBtn').addEventListener('click', () => { setAutoplay(false); goTo(current - 1, false); });
$('replayBtn').addEventListener('click', () => { if (current > 0) playStep(current); });
$('playBtn').addEventListener('click', () => setAutoplay(!autoplay));
window.addEventListener('keydown', e => {
  if (e.target.closest?.('button') && e.key === ' ') return;
  if (e.key === 'ArrowRight') $('nextBtn').click();
  else if (e.key === 'ArrowLeft') $('prevBtn').click();
  else if (e.key === ' ') { e.preventDefault(); $('playBtn').click(); }
});
controls.addEventListener('start', () => { glide = null; });

// ---------------------------------------------------------------- Resize & loop
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = w < 760 ? 52 : 40;
  if (w >= 760) camera.setViewOffset(w, h, 180, 0, w, h);
  else camera.setViewOffset(w, h, 0, h * 0.2, w, h);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  tick(dt);
  tickGlide(dt);
  controls.update();
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- Landing page & routing
const landing = $('landing');
$('heroMeta').textContent = `${FURNITURE.length} guides · free · works on your phone`;
FURNITURE.forEach(f => {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `#${f.id}`;
  a.innerHTML = `
    <div class="card-img"><img src="thumbs/${f.id}.jpg" alt="" loading="lazy" width="800" height="600" /></div>
    <div class="card-body">
      <h3></h3>
      <p></p>
      <ul class="card-meta">
        <li>${f.steps.length - 1} steps</li><li>${f.time}</li><li>${f.people === 1 ? '1 person' : `${f.people} people`}</li>
      </ul>
      <span class="card-go">Open guide <span aria-hidden="true">→</span></span>
    </div>`;
  a.querySelector('h3').textContent = f.short;
  a.querySelector('p').textContent = f.blurb;
  $('cards').appendChild(a);
});

function showLanding(on) {
  const was = !landing.hidden;
  landing.hidden = !on;
  document.body.classList.toggle('on-landing', on);
  if (on) {
    autoplay = false; updatePlayIcon(); anim = null;
    document.title = 'Flat-pack Assembly · 3D Guides';
    renderer.setAnimationLoop(null);
    const target = location.hash === '#guides' ? $('guides') : null;
    if (target) target.scrollIntoView({ behavior: was ? 'smooth' : 'auto' });
    else if (!was) landing.scrollTop = 0;
  } else {
    renderer.setAnimationLoop(frame);
  }
  return was;
}

function route() {
  const [id, step] = location.hash.replace('#', '').split('/');
  const f = FURNITURE.find(x => x.id === id);
  if (!f) { showLanding(true); return; }
  const fromLanding = showLanding(false) || !F;
  const s = parseInt(step, 10) || 0;
  if (f !== F) load(f, s);
  else if (s !== current) goTo(s, false);
  if (fromLanding) {
    camera.position.copy(viewFor(current).pos);
    controls.target.copy(viewFor(current).target);
    glide = null;
    document.title = `${F.title} · 3D Guide`;
  }
}
window.addEventListener('hashchange', route);
route();

requestAnimationFrame(() => $('loader').classList.add('hide'));

// exposed for debugging / screenshots
window.__guide = {
  goTo, snapTo, camera, controls, FURNITURE, route,
  load: (id, step) => load(FURNITURE.find(f => f.id === id), step),
  get current() { return current; }, get busy() { return !!anim; },
};
