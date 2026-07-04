// Draggable 3D lanyard badge — React Three Fiber + rapier rope physics.
// Ported from the original esm.sh build to npm-vendored deps so it bundles
// locally and works everywhere (incl. Brave). Recolored to Obsidian + Cyan.
import React, { useRef, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import cardGlbUrl from "../../assets/card.glb?url";

const h = React.createElement;
const Fragment = React.Fragment;

useGLTF.preload(cardGlbUrl);

/* ---------- swept strap geometry ----------
   A thin rectangular ribbon swept along the physics curve with a
   parallel-transport frame (smooth, no Frenet flips) plus a twist that
   ramps from the card's spin at the bottom to 0 at the fixed anchor. */
const STRAP_WIDTH = 0.187;
const STRAP_THICK = 0.05;
const STRAP_SEG = 32;
const STRAP_TWIST_GAIN = 1.7;
const STRAP_REPEAT = 7; // how many times the logo tile repeats down the band

/* ---------- intro spin ----------
   After the badge falls in and settles, it winds around to show its back
   (the logo) then unwinds back to front — the card turn and the ribbon twist
   are the same value, so they stay physically consistent. Hands back to physics. */
const INTRO_MIN_FALL = 3.0;      // s — don't start spinning mid-fall
const INTRO_MAX_WAIT = 3.5;      // s — start anyway if it never fully settles
const INTRO_SETTLE_VEL = 3.0;    // linear speed below which it's "settled"
const INTRO_SETTLE_FRAMES = 6;   // consecutive settled frames before spinning
const INTRO_SPIN_DUR = 7.0;      // s — time for the whole turn-to-back-and-return
const INTRO_TURN = Math.PI;      // rad — peak rotation; π faces the card's full back at the midpoint
const STRAP_ZREF = new THREE.Vector3(0, 0, 1);
const _sW = new THREE.Vector3(), _sN = new THREE.Vector3();
const _sTi = new THREE.Vector3(), _sq = new THREE.Quaternion(), _sPrev = new THREE.Vector3();
const _sWr = new THREE.Vector3(), _sNr = new THREE.Vector3();

function makeStrapGeometry(M) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(M * 4 * 3), 3));
  const idx = [];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
  for (let i = 0; i < M - 1; i++) {
    const a = i * 4, b = (i + 1) * 4;
    for (const [p, q] of edges) idx.push(a + p, a + q, b + q, a + p, b + q, b + p);
  }
  geo.setIndex(idx);
  // UVs: U runs across the strap (0→1 over the two wide faces, slivers on the
  // thin edges), V runs along its length so a logo tile tiles down the band.
  const uvs = new Float32Array(M * 4 * 2);
  for (let i = 0; i < M; i++) {
    const v = i / (M - 1);
    const o = i * 4 * 2;
    // U is flipped (0 at +width) so the logo reads correctly on the front
    // face that meets the camera at rest — not mirrored.
    uvs[o + 0] = 0; uvs[o + 1] = v; // corner 0: +width, +thick
    uvs[o + 2] = 1; uvs[o + 3] = v; // corner 1: -width, +thick
    uvs[o + 4] = 1; uvs[o + 5] = v; // corner 2: -width, -thick
    uvs[o + 6] = 0; uvs[o + 7] = v; // corner 3: +width, -thick
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return geo;
}

function setStrapCorner(pos, o, P, W, sw, N, sn) {
  pos[o] = P.x + W.x * sw + N.x * sn;
  pos[o + 1] = P.y + W.y * sw + N.y * sn;
  pos[o + 2] = P.z + W.z * sw + N.z * sn;
}

function updateStrap(geo, pts, twist) {
  const M = pts.length;
  const pos = geo.attributes.position.array;
  const hw = STRAP_WIDTH / 2, ht = STRAP_THICK / 2;
  _sPrev.copy(pts[1]).sub(pts[0]).normalize();
  _sW.crossVectors(STRAP_ZREF, _sPrev);
  if (_sW.lengthSq() < 1e-6) _sW.set(1, 0, 0);
  _sW.normalize();
  _sN.crossVectors(_sPrev, _sW).normalize();
  for (let i = 0; i < M; i++) {
    if (i < M - 1) _sTi.copy(pts[i + 1]).sub(pts[i]).normalize();
    else _sTi.copy(_sPrev);
    if (i > 0) {
      _sq.setFromUnitVectors(_sPrev, _sTi);
      _sW.applyQuaternion(_sq);
      _sW.addScaledVector(_sTi, -_sW.dot(_sTi)).normalize();
      _sN.crossVectors(_sTi, _sW).normalize();
    }
    _sPrev.copy(_sTi);
    const theta = twist * (1 - i / (M - 1));
    const c = Math.cos(theta), s = Math.sin(theta);
    _sWr.copy(_sW).multiplyScalar(c).addScaledVector(_sN, s);
    _sNr.copy(_sN).multiplyScalar(c).addScaledVector(_sW, -s);
    const P = pts[i], o = i * 4 * 3;
    setStrapCorner(pos, o + 0, P, _sWr, hw, _sNr, ht);
    setStrapCorner(pos, o + 3, P, _sWr, -hw, _sNr, ht);
    setStrapCorner(pos, o + 6, P, _sWr, -hw, _sNr, -ht);
    setStrapCorner(pos, o + 9, P, _sWr, hw, _sNr, -ht);
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
}

/* ---------- card texture compositing (photo front, logo back) ---------- */
function buildCardTexture(imageSrc, logoSrc, cardColor) {
  return new Promise((resolve) => {
    const res = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = cardColor || "#1a1a1e";
    ctx.fillRect(0, 0, res, res);
    const x0 = res / 2;

    // obsidian back panel + inset hairline frame
    const drawBackPanel = () => {
      ctx.fillStyle = "#141417";
      ctx.fillRect(x0, 0, res / 2, res);
      ctx.strokeStyle = "rgba(244,241,234,0.16)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 46, 46, res / 2 - 92, res - 92);
    };

    const finish = () => {
      // flip vertically (GLB UVs are flipped)
      const t = document.createElement("canvas");
      t.width = res;
      t.height = res;
      const tc = t.getContext("2d");
      tc.scale(1, -1);
      tc.translate(0, -res);
      tc.drawImage(canvas, 0, 0);
      resolve(t.toDataURL());
    };

    // back panel, then the centered company logo (white mark on obsidian)
    const drawBack = (done) => {
      drawBackPanel();
      if (!logoSrc) { done(); return; }
      const logo = new Image();
      logo.onload = () => {
        const box = 300; // contain within a centered square on the back
        const ar = logo.width / logo.height;
        let w = box, hh = box;
        if (ar >= 1) hh = box / ar; else w = box * ar;
        ctx.drawImage(logo, x0 + res / 4 - w / 2, res / 2 - hh / 2, w, hh);
        done();
      };
      logo.onerror = done;
      logo.src = logoSrc;
    };

    // photo COVERs the card front (left half), cropping overflow — no margin.
    const drawFront = (done) => {
      if (!imageSrc) { done(); return; }
      const img = new Image();
      img.onload = () => {
        const tw = res / 2, th = res;
        const ar = img.width / img.height;
        const tar = tw / th;
        let w, hh;
        if (ar > tar) { hh = th; w = th * ar; }
        else { w = tw; hh = tw / ar; }
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, res / 2, res);
        ctx.clip();
        ctx.drawImage(img, (tw - w) / 2, (th - hh) / 2, w, hh);
        ctx.restore();
        done();
      };
      img.onerror = done;
      img.src = imageSrc;
    };

    drawFront(() => drawBack(finish));
  });
}

/* ---------- physics band ---------- */
function Band({ cardImageSrc, strapImageSrc, clipColor, stringColor, onSpinDone, setRunning, maxSpeed = 50, minSpeed = 0 }) {
  const fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef();
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3();
  const iq = new THREE.Quaternion(), ieul = new THREE.Euler(0, 0, 0, "YXZ"), ioff = new THREE.Vector3(), lv = new THREE.Vector3();
  // intro spin: "fall" → "spin" → "done"
  const phaseRef = useRef("fall");
  const startClockRef = useRef(null);
  const settleRef = useRef(0);
  const restRef = useRef(0);
  const spinStartRef = useRef(0);
  const clipAnchorRef = useRef(new THREE.Vector3());
  const [spinning, setSpinning] = useState(false);
  const segmentProps = { type: "dynamic", canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGlbUrl);
  const cardTexture = useTexture(cardImageSrc);
  const strapTexture = useTexture(strapImageSrc);
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const M = STRAP_SEG + 1;
  const [geo] = useState(() => makeStrapGeometry(M));
  const [eul] = useState(() => new THREE.Euler(0, 0, 0, "YXZ"));
  const [cq] = useState(() => new THREE.Quaternion());
  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => { document.body.style.cursor = "auto"; };
    }
  }, [hovered, dragged]);

  useEffect(() => {
    if (cardTexture) {
      cardTexture.wrapS = cardTexture.wrapT = THREE.RepeatWrapping;
      cardTexture.anisotropy = 16;
      cardTexture.needsUpdate = true;
    }
  }, [cardTexture]);

  useEffect(() => {
    if (strapTexture) {
      strapTexture.wrapS = THREE.ClampToEdgeWrapping; // across the band
      strapTexture.wrapT = THREE.RepeatWrapping;      // tile down its length
      strapTexture.repeat.set(1, STRAP_REPEAT);
      strapTexture.anisotropy = 16;
      strapTexture.colorSpace = THREE.SRGBColorSpace;
      strapTexture.needsUpdate = true;
    }
  }, [strapTexture]);

  useFrame((state, delta) => {
    if (startClockRef.current == null) startClockRef.current = state.clock.getElapsedTime();
    const t = state.clock.getElapsedTime() - startClockRef.current;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((r) => r.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }

    // ---- intro: wait for the fall to settle, then start the scripted turn ----
    if (phaseRef.current === "fall" && !dragged && card.current) {
      const v = card.current.linvel();
      const settled = lv.set(v.x, v.y, v.z).length() < INTRO_SETTLE_VEL;
      settleRef.current = settled ? settleRef.current + 1 : 0;
      if (t > INTRO_MAX_WAIT || (t > INTRO_MIN_FALL && settleRef.current >= INTRO_SETTLE_FRAMES)) {
        const p = card.current.translation();
        clipAnchorRef.current.set(p.x, p.y + 1.5, p.z); // hold the clip, swivel below it
        spinStartRef.current = state.clock.getElapsedTime();
        phaseRef.current = "spin";
        setSpinning(true);
      }
    }

    // ---- intro: drive the eased turn (card is kinematic while spinning) ----
    let spinTwist = null;
    if (phaseRef.current === "spin" && card.current) {
      const sp = Math.min(1, (state.clock.getElapsedTime() - spinStartRef.current) / INTRO_SPIN_DUR);
      // shared eased wind-then-unwind: 0 → INTRO_TURN → 0, with zero speed at the
      // start, the back-facing midpoint, and the end. Card turn === ribbon twist,
      // so the badge spins back the other way as the strap unwinds.
      const turn = ((1 - Math.cos(2 * Math.PI * sp)) / 2) * INTRO_TURN;
      iq.setFromEuler(ieul.set(0, turn, 0));
      ioff.set(0, 1.5, 0).applyQuaternion(iq);
      card.current.setNextKinematicRotation({ x: iq.x, y: iq.y, z: iq.z, w: iq.w });
      card.current.setNextKinematicTranslation({
        x: clipAnchorRef.current.x - ioff.x,
        y: clipAnchorRef.current.y - ioff.y,
        z: clipAnchorRef.current.z - ioff.z,
      });
      spinTwist = turn;
      if (sp >= 1) {
        phaseRef.current = "done";
        setSpinning(false);
        onSpinDone && onSpinDone();
      }
    }

    if (fixed.current) {
      [j1, j2, j3].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clamped = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clamped * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.lerped);
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      let twist;
      if (spinTwist !== null) {
        twist = spinTwist;
      } else {
        const cardRot = card.current.rotation();
        cq.set(cardRot.x, cardRot.y, cardRot.z, cardRot.w);
        eul.setFromQuaternion(cq);
        twist = eul.y * STRAP_TWIST_GAIN;
      }
      updateStrap(geo, curve.getPoints(STRAP_SEG), twist);
      if (phaseRef.current !== "spin") {
        ang.copy(card.current.angvel());
        rot.copy(card.current.rotation());
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
      }
      // Once the intro is over and the badge has come to rest facing front,
      // let the render loop idle (host switches it to on-demand) so it stops
      // stepping physics every frame forever. Pointer interaction revives it.
      if (setRunning && phaseRef.current === "done" && !dragged) {
        const v = card.current.linvel();
        const atRest = lv.set(v.x, v.y, v.z).length() + ang.length() < 0.08 && Math.abs(rot.y) < 0.02;
        restRef.current = atRest ? restRef.current + 1 : 0;
        if (restRef.current >= 20) setRunning(false);
      }
    }
  });

  curve.curveType = "centripetal";

  return h(Fragment, null,
    h("group", { position: [0, 4, 0] },
      h(RigidBody, { ref: fixed, ...segmentProps, type: "fixed" }),
      h(RigidBody, { position: [0.5, 0, 0], ref: j1, ...segmentProps }, h(BallCollider, { args: [0.1] })),
      h(RigidBody, { position: [1, 0, 0], ref: j2, ...segmentProps }, h(BallCollider, { args: [0.1] })),
      h(RigidBody, { position: [1.5, 0, 0], ref: j3, ...segmentProps }, h(BallCollider, { args: [0.1] })),
      h(RigidBody, { position: [2, 0, 0], ref: card, ...segmentProps, type: dragged || spinning ? "kinematicPosition" : "dynamic" },
        h(CuboidCollider, { args: [0.8, 1.125, 0.01] }),
        h("group", {
          scale: 2.25,
          position: [0, -1.2, -0.05],
          onPointerOver: () => setHovered(true),
          onPointerOut: () => setHovered(false),
          onPointerUp: (e) => { e.target.releasePointerCapture(e.pointerId); setDragged(false); },
          onPointerDown: (e) => {
            e.target.setPointerCapture(e.pointerId);
            setRunning && setRunning(true); // wake the loop for the drag
            restRef.current = 0;
            // grabbing it cancels the intro turn and reveals the drag hint
            if (phaseRef.current !== "done") {
              phaseRef.current = "done";
              setSpinning(false);
              onSpinDone && onSpinDone();
            }
            if (card.current) setDragged(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
          },
        },
          h("mesh", { geometry: nodes.card.geometry },
            h("meshPhysicalMaterial", { map: cardTexture, color: "#ffffff", clearcoat: 1, clearcoatRoughness: 0.15, roughness: 0.9, metalness: 0.8 })),
          h("mesh", { geometry: nodes.clip.geometry },
            h("meshPhysicalMaterial", { material: materials.metal, color: clipColor, roughness: 0.3, metalness: 0.8 })),
          h("mesh", { geometry: nodes.clamp.geometry },
            h("meshPhysicalMaterial", { material: materials.metal, color: clipColor, roughness: 0.3, metalness: 0.8 }))
        )
      )
    ),
    h("mesh", { geometry: geo },
      h("meshStandardMaterial", { map: strapTexture, color: "#ffffff", side: THREE.DoubleSide, roughness: 0.7, metalness: 0.0, envMapIntensity: 0.4 })
    )
  );
}

/* ---------- app ---------- */
function LanyardApp({ image, strapImage, backLogo, cardColor, clipColor, strapColor, onReady, onSpinDone }) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let cancelled = false;
    buildCardTexture(image, backLogo, cardColor).then((u) => { if (!cancelled) setTex(u); });
    return () => { cancelled = true; };
  }, [image, backLogo, cardColor]);

  // signal readiness ~2 frames after the card texture is built, so the
  // host can cross-fade out the static badge with content already on screen.
  useEffect(() => {
    if (!tex || !onReady) return;
    let raf2;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => onReady()); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [tex, onReady]);

  // ---- render-loop gating ----
  // The lanyard runs a continuous physics + render loop; left unchecked it
  // never lets the main thread idle, which tanks the perf score on slower
  // hardware. Gate it: "always" while it's animating, "demand" once it has
  // settled (revives on pointer interaction), "never" when off-screen or the
  // tab is hidden. On-screen behaviour is unchanged.
  const wrapRef = useRef(null);
  const [frameloop, setFrameloop] = useState("always");
  const runningRef = useRef(true);
  const onScreenRef = useRef(true);
  const tabVisibleRef = useRef(true);
  const syncFrameloop = useCallback(() => {
    const visible = onScreenRef.current && tabVisibleRef.current;
    setFrameloop(!visible ? "never" : runningRef.current ? "always" : "demand");
  }, []);
  const setRunning = useCallback((v) => {
    if (runningRef.current === v) return;
    runningRef.current = v;
    syncFrameloop();
  }, [syncFrameloop]);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    tabVisibleRef.current = !document.hidden;
    const io = new IntersectionObserver(([entry]) => {
      onScreenRef.current = entry.isIntersecting;
      syncFrameloop();
    }, { threshold: 0.01 });
    io.observe(el);
    const onVisibility = () => { tabVisibleRef.current = !document.hidden; syncFrameloop(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [syncFrameloop]);

  return h("div", { ref: wrapRef, style: { width: "100%", height: "100%" } },
    h(Canvas, {
      camera: { position: [0, 0, 9.5], fov: 25 },
      gl: { alpha: true, preserveDrawingBuffer: true },
      dpr: [1, 2],
      frameloop,
      resize: { debounce: 0, scroll: false },
      onCreated: ({ gl }) => gl.setClearColor(new THREE.Color(0), 0),
      style: { width: "100%", height: "100%", touchAction: "none" },
    },
      h("ambientLight", { intensity: 1.1 }),
      h(Physics, { gravity: [0, -40, 0], timeStep: 1 / 60 },
        tex && h(React.Suspense, { fallback: null },
          h(Band, { cardImageSrc: tex, strapImageSrc: strapImage, clipColor, stringColor: strapColor, onSpinDone, setRunning }))
      ),
      h(Environment, { blur: 0.75 },
        h(Lightformer, { intensity: 2, color: "white", position: [0, -1, 5], rotation: [0, 0, Math.PI / 3], scale: [100, 0.1, 1] }),
        h(Lightformer, { intensity: 3, color: "white", position: [-1, -1, 1], rotation: [0, 0, Math.PI / 3], scale: [100, 0.1, 1] }),
        h(Lightformer, { intensity: 3, color: "white", position: [1, 1, 1], rotation: [0, 0, Math.PI / 3], scale: [100, 0.1, 1] }),
        h(Lightformer, { intensity: 10, color: "white", position: [-10, 0, 14], rotation: [0, Math.PI / 2, Math.PI / 3], scale: [100, 10, 1] })
      )
    )
  );
}

/* ---------- imperative mount API (no custom element / no host React clash) ---------- */
let root = null;

export function mount(el, props) {
  if (root) {
    // already mounted — surface the misuse instead of silently dropping props
    console.warn("lanyard: mount() called twice; ignoring the second call");
    return;
  }
  root = createRoot(el);
  root.render(h(LanyardApp, props));
}

export function unmount() {
  if (root) { root.unmount(); root = null; }
}
