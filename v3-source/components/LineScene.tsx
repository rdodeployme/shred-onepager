'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BP, img } from '@/lib';

/* ------------------------------------------------------------------ story */
const PANELS = [
  { until: 0.1 },
  { until: 0.3 },
  { until: 0.47 },
  { until: 0.78 },
  { until: 0.92 },
  { until: 1.01 },
];

type Callout = { n: string; t: string; d: string; part: string; at: [number, number, number]; dx: number; dy: number };
const CALLOUTS: Callout[] = [
  { n: '01', t: 'Infeed conveyor', d: 'Loads material at a controlled feed rate', part: 'P_infeed', at: [0, 1.75, 5.2], dx: -34, dy: 74 },
  { n: '02', t: 'Feed hopper', d: 'Controls material flow into the size-reduction stage', part: 'P_hopper', at: [0, 3.3, -1.25], dx: 64, dy: -34 },
  { n: '03', t: 'Twin cutting shafts', d: 'Counter-rotating cutters shear material down to size', part: 'P_shaftB', at: [0.6, 1.9, -0.26], dx: -50, dy: -62 },
  { n: '04', t: 'Drive unit', d: 'Gearbox and motors that turn the shafts', part: 'P_drive', at: [2.7, 1.9, -0.3], dx: -56, dy: 84 },
  { n: '05', t: 'Service platform', d: 'Guarded access for inspection and maintenance', part: 'P_frame', at: [-2.25, 2.5, 1.15], dx: -70, dy: 44 },
  { n: '06', t: 'Discharge & magnet', d: 'Moves material on; the magnet lifts out ferrous metal', part: 'P_discharge', at: [0, 2.75, -3.6], dx: 30, dy: -80 },
  { n: '07', t: 'Collection', d: 'Receives separated outputs for onward recycling', part: 'P_bin', at: [0, 1.5, -6.3], dx: -40, dy: 84 },
];

// explode offsets in three.js space (x right / y up / z toward infeed)
const EXPLODE: Record<string, [number, number, number]> = {
  P_infeed: [0, 0.3, 1.8],
  P_hopper: [0, 3.3, 0],
  P_chamber: [0, 0.75, 0],
  P_shaftA: [0, 1.95, 0.55],
  P_shaftB: [0, 1.95, -0.55],
  P_drive: [2.3, 0.75, 0],
  P_frame: [-0.9, 0, 0],
  P_discharge: [0, 0, -1.3],
  P_bin: [0, 0, -2.4],
};

type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number]; off: number };
const HERO: [number, number, number] = [0, 1.75, 0.2];
const KEYS: Key[] = [
  { p: 0.0, pos: [14.4, 5.4, 12.4], tgt: HERO, off: 0.235 },
  { p: 0.07, pos: [13.8, 5.6, 12.0], tgt: HERO, off: 0.235 },
  { p: 0.2, pos: [3.3, 6.3, 1.5], tgt: [0.05, 1.9, -0.05], off: 0.26 },
  { p: 0.28, pos: [3.0, 6.5, 1.1], tgt: [0.05, 1.9, -0.05], off: 0.26 },
  { p: 0.45, pos: [23.2, 9.6, 9.3], tgt: [0, 3.5, -0.3], off: 0.11 },
  { p: 0.78, pos: [24.4, 9.6, 5.4], tgt: [0, 3.5, -0.3], off: 0.11 },
  { p: 0.93, pos: [14.2, 4.9, 13.2], tgt: HERO, off: 0.235 },
  { p: 1.0, pos: [13.6, 4.8, 13.8], tgt: HERO, off: 0.235 },
];
// portrait screens: tighter on the shredder, and down the line for the exploded view
const KEYS_M: Key[] = [
  { p: 0.0, pos: [15, 8.6, 13.5], tgt: [0, 1.7, 0], off: 0 },
  { p: 0.07, pos: [14.4, 8.9, 13.2], tgt: [0, 1.7, 0], off: 0 },
  { p: 0.2, pos: [4.6, 9.4, 2.2], tgt: [0, 1.9, 0], off: 0 },
  { p: 0.28, pos: [4.2, 9.6, 1.7], tgt: [0, 1.9, 0], off: 0 },
  { p: 0.45, pos: [11, 19, 27], tgt: [0.4, 3.0, -0.8], off: 0 },
  { p: 0.78, pos: [7, 19, 28.5], tgt: [0.4, 3.0, -0.8], off: 0 },
  { p: 0.93, pos: [14.6, 8.2, 13.8], tgt: [0, 1.7, 0], off: 0 },
  { p: 1.0, pos: [14, 8.0, 14.4], tgt: [0, 1.7, 0], off: 0 },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (v: number, a: number, b: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const stageFor = (p: number) => PANELS.findIndex((s) => p < s.until);

export default function LineScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas = canvasRef.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setClearColor(0x050505, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 26, 62);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.42;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

    // lights
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(9, 14, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera;
    sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd6ff, 1.7);
    rim.position.set(-10, 7, -9);
    scene.add(rim);
    const glow = new THREE.PointLight(0x00ed00, 42, 15, 1.8);
    glow.position.set(-1.5, 1.2, -6.5);
    scene.add(glow);
    const glow2 = new THREE.PointLight(0x00ed00, 5, 7, 2);
    glow2.position.set(0, 3.1, 0.3);
    scene.add(glow2);

    // floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(70, 64),
      new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.62, metalness: 0.25 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(120, 120, 0x1d241d, 0x131613);
    grid.position.y = 0.004;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.75;
    scene.add(grid);

    // ---------------------------------------------------------------- model
    const parts: Record<string, { node: THREE.Object3D; base: THREE.Vector3 }> = {};
    let shaftA: THREE.Object3D | null = null;
    let shaftB: THREE.Object3D | null = null;
    let loaded = false;

    new GLTFLoader().load(
      `${BP}/model/shred-line.glb`,
      (gltf) => {
        gltf.scene.traverse((o: any) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            const m = o.material as THREE.MeshStandardMaterial;
            if (m.name === 'accent') {
              m.color.set(0x00ed00);
              m.emissive.set(0x00ed00);
              m.emissiveIntensity = 0.32;
              m.roughness = 0.5;
              m.metalness = 0;
            }
            if (m.name === 'body') { m.color.set(0x15171a); m.roughness = 0.48; }
            if (m.name === 'rubber') { m.color.set(0x08090a); m.roughness = 0.95; m.metalness = 0; }
            if (m.name === 'steel') { m.roughness = 0.2; m.envMapIntensity = 2.2; }
            if (m.name === 'panel') { m.color.set(0x5d6165); m.roughness = 0.5; m.metalness = 0.7; }
          }
          if (o.name && EXPLODE[o.name]) parts[o.name] = { node: o, base: o.position.clone() };
          if (o.name === 'P_shaftA') shaftA = o;
          if (o.name === 'P_shaftB') shaftB = o;
        });
        scene.add(gltf.scene);
        loaded = true;
        setReady(true);
        dirty = true;
      },
      undefined,
      () => setFailed(true)
    );

    // ---------------------------------------------------------------- material in motion
    const FEED_N = 8;
    const feedGeo = new THREE.BoxGeometry(1, 1, 1);
    const feedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
    const feed = new THREE.InstancedMesh(feedGeo, feedMat, FEED_N);
    feed.castShadow = true;
    const tones = [0x6f7478, 0x9a9da1, 0x4b4f53, 0x82878b, 0x5a5e62];
    for (let i = 0; i < FEED_N; i++) feed.setColorAt(i, new THREE.Color(tones[i % tones.length]));
    scene.add(feed);
    const feedDims = Array.from({ length: FEED_N }, (_, i) => {
      const r = (k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
      return { w: 0.55 + r(1) * 0.4, h: 0.16 + r(2) * 0.22, l: 0.6 + r(3) * 0.55, x: (r(4) - 0.5) * 0.25, rot: (r(5) - 0.5) * 0.6 };
    });
    const CHIP_N = 150;
    const chipGeo = new THREE.TetrahedronGeometry(0.055, 0);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0xb9bdbb, roughness: 0.5, metalness: 0.6 });
    const chips = new THREE.InstancedMesh(chipGeo, chipMat, CHIP_N);
    chips.castShadow = true;
    scene.add(chips);
    const chipSeed = Array.from({ length: CHIP_N }, (_, i) => {
      const r = (k: number) => ((Math.sin(i * 39.3468 + k * 11.135) * 24634.6345) % 1 + 1) % 1;
      return { t: r(1), x: (r(2) - 0.5) * 0.62, s: 0.6 + r(3) * 1.5, spin: r(4) * 6.28, y: r(5) * 0.05 };
    });
    const iTail = new THREE.Vector3(0, 0.7, 6.7), iHead = new THREE.Vector3(0, 3.78, 0.85);
    const dTail = new THREE.Vector3(0, 0.72, 0.55), dHead = new THREE.Vector3(0, 2.75, -4.45);
    const iAng = Math.atan2(iHead.y - iTail.y, iTail.z - iHead.z);
    const dummy = new THREE.Object3D();
    const v = new THREE.Vector3();

    function animateMaterial(time: number, show: number) {
      feed.visible = chips.visible = show > 0.01;
      if (!feed.visible) return;
      for (let i = 0; i < FEED_N; i++) {
        const d = feedDims[i];
        const t = (time * 0.05 + i / FEED_N) % 1;
        let s = show;
        if (t < 0.84) {
          const k = t / 0.84;
          v.lerpVectors(iTail, iHead, 0.04 + k * 0.94);
          dummy.position.set(d.x, v.y + (0.08 + d.h / 2) / Math.cos(iAng) * 0.9, v.z);
          dummy.rotation.set(iAng, d.rot, 0, 'YXZ');
          s *= sstep(k, 0, 0.06);
        } else {
          const k = (t - 0.84) / 0.16;
          dummy.position.set(d.x * (1 - k), iHead.y + 0.2 - k * k * 1.9, iHead.z - 0.1 - k * 0.75);
          dummy.rotation.set(iAng + k * 1.6, d.rot, k * 0.5, 'YXZ');
          s *= 1 - sstep(k, 0.72, 1);
        }
        dummy.scale.set(d.w * s, d.h * s, d.l * s);
        dummy.updateMatrix();
        feed.setMatrixAt(i, dummy.matrix);
      }
      feed.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < CHIP_N; i++) {
        const c = chipSeed[i];
        const t = (time * 0.085 + c.t) % 1;
        let s = c.s * show;
        if (t < 0.8) {
          const k = t / 0.8;
          v.lerpVectors(dTail, dHead, 0.05 + k * 0.94);
          dummy.position.set(c.x, v.y + 0.12 + c.y, v.z);
          dummy.rotation.set(c.spin, c.spin * 1.7, 0);
          s *= sstep(k, 0, 0.05);
        } else {
          const k = (t - 0.8) / 0.2;
          dummy.position.set(c.x * (1 + k * 0.6), dHead.y + 0.15 + k * 0.35 - k * k * 2.1, dHead.z - k * 1.0);
          dummy.rotation.set(c.spin + k * 9, c.spin * 1.7 + k * 5, 0);
          s *= 1 - sstep(k, 0.85, 1);
        }
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        chips.setMatrixAt(i, dummy.matrix);
      }
      chips.instanceMatrix.needsUpdate = true;
    }

    // ---------------------------------------------------------------- sizing
    let W = 1, H = 1, mobile = false;
    function resize() {
      const r = canvas.parentElement!.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      mobile = W < 860 && H > W;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      const sc2 = mobile ? 0.5 : 1;
      CALLOUTS.forEach((c, idx) => {
        const el = calloutRefs.current[idx];
        if (!el) return;
        const dx = c.dx * sc2, dy = c.dy * sc2;
        const ln = el.querySelector('u') as HTMLElement, card = el.querySelector('.callout-card') as HTMLElement;
        ln.style.width = `${Math.hypot(dx, dy).toFixed(1)}px`;
        ln.style.transform = `rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`;
        card.style.top = `${dy}px`;
        card.style.left = dx >= 0 ? `${dx}px` : 'auto';
        card.style.right = dx < 0 ? `${-dx}px` : 'auto';
      });
      dirty = true;
    }

    // ---------------------------------------------------------------- frame
    let target = 0, p = 0, visible = true, dirty = true, raf = 0, last = performance.now(), time = 0, lastStage = -1;
    const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();

    function readScroll() {
      const r = section.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      target = clamp(-r.top / travel);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      const before = p;
      p += (target - p) * Math.min(1, dt * 7);
      if (Math.abs(target - p) < 0.0002) p = target;
      const moving = Math.abs(p - before) > 0.00001;
      if (reduce && !moving && !dirty) return;
      dirty = false;
      if (!reduce) time += dt;

      // camera
      const K = mobile ? KEYS_M : KEYS;
      let i = 0;
      while (i < K.length - 2 && p > K[i + 1].p) i++;
      const k0 = K[i], k1 = K[i + 1];
      const t = sstep(p, k0.p, k1.p);
      a.fromArray(k0.pos); b.fromArray(k1.pos); pos.lerpVectors(a, b, t);
      a.fromArray(k0.tgt); b.fromArray(k1.tgt); tgt.lerpVectors(a, b, t);
      const off = k0.off + (k1.off - k0.off) * t;
      // idle drift
      const sway = reduce ? 0 : Math.sin(time * 0.22) * 0.045;
      pos.sub(tgt).applyAxisAngle(THREE.Object3D.DEFAULT_UP, sway);
      // keep the line in frame on narrow screens
      const fit = mobile ? clamp(0.46 / camera.aspect, 0.8, 1.25) : clamp(Math.pow(1.72 / camera.aspect, 0.82), 1, 2.2);
      pos.multiplyScalar(fit);
      const dist = pos.length();
      (scene.fog as THREE.Fog).near = Math.max(26, dist * 1.15);
      (scene.fog as THREE.Fog).far = Math.max(62, dist * 2.6);
      pos.add(tgt);
      camera.position.copy(pos);
      camera.lookAt(tgt);
      if (mobile) camera.setViewOffset(W, H, 0, -H * 0.23, W, H);
      else camera.setViewOffset(W, H, -W * off, 0, W, H);
      camera.updateProjectionMatrix();

      // explode
      const e = sstep(p, 0.3, 0.46) * (1 - sstep(p, 0.78, 0.92));
      if (loaded) {
        for (const name in parts) {
          const o = EXPLODE[name], pt = parts[name];
          pt.node.position.set(pt.base.x + o[0] * e, pt.base.y + o[1] * e, pt.base.z + o[2] * e);
        }
        const spin = time * 0.9;
        if (shaftA) (shaftA as THREE.Object3D).rotation.x = -spin;
        if (shaftB) (shaftB as THREE.Object3D).rotation.x = spin;
      }
      animateMaterial(time, (1 - sstep(p, 0.25, 0.31)) + sstep(p, 0.9, 0.96));
      glow2.intensity = 5 * (1 - e);

      renderer.render(scene, camera);

      // callouts
      const fade = 1 - sstep(p, 0.74, 0.78);
      CALLOUTS.forEach((c, idx) => {
        const el = calloutRefs.current[idx];
        if (!el) return;
        const o = EXPLODE[c.part];
        v.set(c.at[0] + o[0] * e, c.at[1] + o[1] * e, c.at[2] + o[2] * e).project(camera);
        const op = sstep(p, 0.47 + idx * 0.032, 0.5 + idx * 0.032) * fade;
        el.style.opacity = op.toFixed(3);
        el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px,0)`;
      });
      if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (cueRef.current) cueRef.current.style.opacity = String(1 - sstep(p, 0.01, 0.06));
      if (lockRef.current) lockRef.current.style.opacity = String(sstep(p, 0.93, 0.98));
      const s = stageFor(p);
      if (s !== lastStage) { lastStage = s; setStage(s); }
    }

    const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) { last = performance.now(); dirty = true; } }, { rootMargin: '10% 0px' });
    io.observe(section);
    const onScroll = () => { readScroll(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    resize();
    readScroll();
    p = target;
    raf = requestAnimationFrame(frame);
    (window as any).__shred = { setP: (x: number) => { target = x; p = x; dirty = true; } };

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  const panel = (i: number) => `panel${stage === i ? ' on' : ''}`;

  return (
    <section className="story" id="line" ref={sectionRef} aria-label="SHRED — industrial shredding and how the processing line works">
      <div className="story-sticky">
        <div className={`story-stage${ready ? ' ready' : ''}`}>
          {failed ? (
            <div className="story-poster" style={{ backgroundImage: `url(${img('render-line.webp')})` }} role="img" aria-label="Rendered view of a twin-shaft shredding line" />
          ) : (
            <canvas ref={canvasRef} aria-label="Interactive 3D model of a twin-shaft shredding line" />
          )}
          <div className="story-shade" aria-hidden="true" />
          <div className="callouts" aria-hidden={stage !== 3}>
            {CALLOUTS.map((c, i) => (
              <div key={c.n} className="callout" ref={(el) => { calloutRefs.current[i] = el; }} style={{ opacity: 0 }}>
                <u />
                <i data-n={c.n} />
                <div className="callout-card">
                  <span>{c.n}</span>
                  <div><b>{c.t}</b><small>{c.d}</small></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="story-copy wrap">
          <article className={`${panel(0)} hero-panel`} aria-hidden={stage !== 0}>
            <p className="kicker"><em />Industrial shredding &amp; material processing</p>
            <h1 className="mega">
              <span className="ln"><span>Some material</span></span>
              <span className="ln"><span>has no</span></span>
              <span className="ln"><span><b className="knock">pathway.</b></span></span>
              <span className="ln"><span>We build one.</span></span>
            </h1>
            <p className="sub">Defective product, factory offcuts, obsolete stock, mixed loads nobody wants to quote. We look at what it&rsquo;s made of, run a trial if it needs one, and give you a straight answer.</p>
            <div className="btns">
              <a href="#submit" className="btn btn-g" tabIndex={stage === 0 ? 0 : -1}>Submit a material challenge</a>
              <a href="#capability" className="btn btn-o hide-m" tabIndex={stage === 0 ? 0 : -1}>What we shred</a>
            </div>
          </article>

          <article className={panel(1)} aria-hidden={stage !== 1}>
            <p className="kicker"><em />01 / The cut</p>
            <h2 className="big">Size reduction<br />comes first.</h2>
            <p className="sub">Two counter-rotating shafts pull material down between them and shear it to a size the rest of the line can separate.</p>
          </article>

          <article className={`${panel(2)} hi`} aria-hidden={stage !== 2}>
            <p className="kicker"><em />02 / Separation</p>
            <h2 className="big">One line.<br />Seven systems.</h2>
            <p className="sub">The line pulls apart into its working modules, so you can see what each one is there to do.</p>
          </article>

          <article className={`${panel(3)} hi`} aria-hidden={stage !== 3}>
            <p className="kicker"><em />03 / Inspection</p>
            <h2 className="big">Every part<br />has a job.</h2>
            <p className="sub">Feed, cut, drive, discharge, recover. Each module is specified around the material in front of it.</p>
            <ol className="legend">
              {CALLOUTS.map((c) => (<li key={c.n}><span>{c.n}</span>{c.t}</li>))}
            </ol>
          </article>

          <article className={`${panel(4)} hi`} aria-hidden={stage !== 4}>
            <p className="kicker"><em />04 / Reassembly</p>
            <h2 className="big">Back to work.</h2>
            <p className="sub">The labels clear and every module locks back into its working position.</p>
          </article>

          <article className={panel(5)} aria-hidden={stage !== 5}>
            <p className="kicker"><em />05 / Complete line</p>
            <h2 className="big">One complete<br />system.</h2>
            <p className="sub">Assessment, processing and recovery, built as a single pathway. That&rsquo;s what SHRED scopes for your material.</p>
            <div className="btns">
              <a href="#submit" className="btn btn-g" tabIndex={stage === 5 ? 0 : -1}>Submit a material challenge</a>
            </div>
          </article>
        </div>

        <div className="story-foot wrap">
          <div className="scroll-cue" ref={cueRef}><span className="mouse" aria-hidden="true"><i /></span>Scroll to take the line apart</div>
          <div className="lockup" ref={lockRef} style={{ opacity: 0 }}><i />Complete processing line</div>
          <ol className="rail" aria-hidden="true">
            {['Line', 'Cut', 'Separate', 'Inspect', 'Rebuild', 'Complete'].map((l, i) => (
              <li key={l} className={i === stage ? 'on' : i < stage ? 'done' : ''}><span>{l}</span></li>
            ))}
          </ol>
          <div className="badge">Illustrative 3D model &mdash; not site plant</div>
        </div>
        <div className="progress" aria-hidden="true"><span ref={barRef} /></div>
      </div>
    </section>
  );
}
