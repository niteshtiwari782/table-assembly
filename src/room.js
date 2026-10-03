// A generic living room the furniture is assembled in.
// Walls only render from the inside, so when the camera swings past one it simply disappears.
import { THREE, V, M, mesh, box, cyl, rbox, at, group, rng, canvasTexture } from './kit.js';

export const ROOM = { R: 520, H: 300 };

function plankTexture() {
  const t = canvasTexture(1024, 1024, (g, w, h) => {
    const rnd = rng(41);
    const rows = 10, rh = h / rows;
    const tones = ['#c9a176', '#c49a6c', '#cfa77b', '#c09468', '#caa074'];
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 400;
      while (x < w) {
        const len = 650 + rnd() * 700;
        g.fillStyle = tones[Math.floor(rnd() * tones.length)];
        g.fillRect(x, r * rh, len, rh);
        g.strokeStyle = '#6b4a2b';
        for (let i = 0; i < 9; i++) {
          g.globalAlpha = 0.06 + rnd() * 0.08; g.lineWidth = 0.8 + rnd() * 1.6;
          const y = r * rh + rnd() * rh, amp = 1 + rnd() * 3, ph = rnd() * 6;
          g.beginPath();
          for (let xx = Math.max(0, x); xx <= Math.min(w, x + len); xx += 10) {
            const yy = y + Math.sin(xx * 0.01 + ph) * amp;
            xx === Math.max(0, x) ? g.moveTo(xx, yy) : g.lineTo(xx, yy);
          }
          g.stroke();
        }
        g.globalAlpha = 0.5; g.fillStyle = '#5a3e25';
        g.fillRect(x, r * rh, 2, rh);                 // butt joint
        g.globalAlpha = 1;
        x += len;
      }
      g.globalAlpha = 0.55; g.fillStyle = '#5a3e25';
      g.fillRect(0, r * rh, w, 2);                    // long seam
      g.globalAlpha = 1;
    }
  });
  t.repeat.set(4, 4);
  return t;
}

function rugTexture() {
  return canvasTexture(512, 384, (g, w, h) => {
    g.fillStyle = '#d8cbb8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a8927a'; g.lineWidth = 10; g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = '#bfae97'; g.lineWidth = 4; g.strokeRect(42, 42, w - 84, h - 84);
    const rnd = rng(5);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = rnd() < 0.5 ? '#8f7a62' : '#efe6d8';
      g.globalAlpha = 0.08; g.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
  });
}

function skyTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#9cc7ec'); grd.addColorStop(0.75, '#e4f0f8'); grd.addColorStop(1, '#cfe0c4');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.globalAlpha = 0.7;
    [[60, 70, 34], [95, 62, 26], [180, 110, 30], [205, 104, 22]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  });
}

function artTexture(seed, palette) {
  return canvasTexture(320, 240, (g, w, h) => {
    g.fillStyle = palette[0]; g.fillRect(0, 0, w, h);
    const rnd = rng(seed);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = palette[1 + (i % (palette.length - 1))];
      g.globalAlpha = 0.85;
      g.beginPath();
      g.arc(rnd() * w, rnd() * h, 25 + rnd() * 70, 0, 7);
      g.fill();
    }
  });
}

export function buildRoom() {
  const { R, H } = ROOM;
  const room = new THREE.Group();

  // Floor
  const floor = mesh(new THREE.PlaneGeometry(2 * R, 2 * R), new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.75 }));
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  room.add(floor);

  // Walls (single-sided, facing in)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xebe6de, roughness: 0.95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xc9d2c3, roughness: 0.95 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.5 });
  const walls = [
    { p: V(0, H / 2, -R), ry: 0, mat: accentMat },          // back
    { p: V(0, H / 2, R), ry: Math.PI, mat: wallMat },       // front
    { p: V(-R, H / 2, 0), ry: Math.PI / 2, mat: wallMat },  // left
    { p: V(R, H / 2, 0), ry: -Math.PI / 2, mat: wallMat },  // right
  ];
  walls.forEach(w => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, H), w.mat);
    wall.position.copy(w.p); wall.rotation.y = w.ry;
    wall.receiveShadow = true;
    // skirting board, as a child so it sits on the wall
    const skirt = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 10), trimMat);
    skirt.position.set(0, -H / 2 + 5, 0.3);
    wall.add(skirt);
    room.add(wall);
  });

  // Things hung on a wall are built in wall space (+Z = into the room), then attached
  const onWall = (wallIndex, obj, x, y) => {
    const holder = new THREE.Group();
    holder.position.copy(walls[wallIndex].p).setY(0);
    holder.rotation.y = walls[wallIndex].ry;
    obj.position.x = x; obj.position.y = y;
    holder.add(obj);
    room.add(holder);
    return obj;
  };

  // Window on the back wall
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture() });
  const win = group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(180, 150), skyMat);
  glass.position.z = 0.4;
  win.add(glass);
  [[0, 78, 192, 6], [0, -78, 192, 6]].forEach(([x, y, w, h]) => win.add(at(box(w, h, 6, trimMat), x, y, 3)));
  [[-93, 0], [93, 0]].forEach(([x]) => win.add(at(box(6, 150, 6, trimMat), x, 0, 3)));
  win.add(at(box(4, 150, 4, trimMat), 0, 0, 2), at(box(180, 4, 4, trimMat), 0, 10, 2));
  win.add(at(box(210, 4, 16, trimMat), 0, -82, 8));                   // sill
  onWall(0, win, -150, 165);
  // Curtains + rod
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0xf1e7d6, roughness: 1 });
  const curtains = group();
  [-130, 130].forEach(x => {
    for (let i = 0; i < 4; i++) curtains.add(at(cyl(6, 7, 240, curtainMat, 10), x + (x < 0 ? -1 : 1) * i * 10, 0, 12));
  });
  const rod = cyl(1.2, 1.2, 330, M.walnut); rod.rotation.z = Math.PI / 2; rod.position.set(0, 122, 14);
  curtains.add(rod);
  onWall(0, curtains, -150, 125);

  // Framed art on the back wall and on the right wall
  const art = (seed, palette, w, h) => {
    const frame = group(box(w + 8, h + 8, 3, M.walnut));
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: artTexture(seed, palette), roughness: 0.9 }));
    canvas.position.z = 1.6;
    frame.add(canvas);
    frame.children[0].position.z = 0;
    frame.position.z = 1.5;
    return frame;
  };
  onWall(0, art(3, ['#f2e8d8', '#d9894f', '#2f4858', '#86a789'], 90, 66), 220, 170);
  onWall(3, art(9, ['#e7ecef', '#3f6c8f', '#e0b04f', '#c35f4a'], 70, 90), -60, 165);
  onWall(3, art(15, ['#f4efe6', '#8aa39b', '#2c3e50'], 56, 72), 30, 155);

  // Door on the left wall
  const door = group(at(box(92, 210, 4, trimMat), 0, 105, 2));
  door.add(at(box(80, 200, 2, new THREE.MeshStandardMaterial({ color: 0xfaf8f4, roughness: 0.5 })), 0, 100, 4.5));
  const knob = at(new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), M.brass), 32, 100, 7);
  door.add(knob);
  onWall(2, door, 200, 0);

  // Plants in pots
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x5f8a5a, roughness: 0.8, flatShading: true });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x739e63, roughness: 0.8, flatShading: true });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc46f4c, roughness: 0.85 });
  const plant = (x, z, s, seed) => {
    const g = group(at(cyl(18 * s, 13 * s, 40 * s, potMat, 20), 0, 20 * s, 0));
    const rnd = rng(seed);
    for (let i = 0; i < 9; i++) {
      const leaf = mesh(new THREE.IcosahedronGeometry((14 + rnd() * 12) * s, 0), i % 2 ? leafMat : leafMat2);
      leaf.position.set((rnd() - 0.5) * 40 * s, (55 + rnd() * 60) * s, (rnd() - 0.5) * 40 * s);
      g.add(leaf);
    }
    g.position.set(x, 0, z);
    room.add(g);
  };
  plant(R - 70, -R + 70, 1.2, 4);
  plant(-R + 330, -R + 45, 0.75, 8);

  // Floor lamp, back-left corner
  const lamp = group(at(cyl(16, 18, 2, M.steel), 0, 1, 0), at(cyl(1.2, 1.2, 160, M.steel), 0, 80, 0));
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 1 });
  lamp.add(at(mesh(new THREE.CylinderGeometry(18, 26, 30, 24, 1, true), shadeMat), 0, 168, 0));
  const lampLight = new THREE.PointLight(0xffd9a0, 0, 900, 2);
  lampLight.position.set(0, 160, 0);
  lamp.add(lampLight);
  lamp.position.set(-R + 70, 0, -R + 70);
  room.add(lamp);

  // Rug under the work area
  const rug = new THREE.Mesh(new THREE.BoxGeometry(440, 0.3, 340), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1 }));
  rug.position.y = 0.15;
  rug.receiveShadow = true;
  room.add(rug);

  return {
    group: room,
    setDark(dark) {
      wallMat.color.set(dark ? 0xa9a49c : 0xebe6de);
      accentMat.color.set(dark ? 0x8d9688 : 0xc9d2c3);
      skyMat.color.set(dark ? 0x31405a : 0xffffff);
      lampLight.intensity = dark ? 90000 : 0;
      shadeMat.emissiveIntensity = dark ? 1.4 : 0.6;
    },
  };
}
