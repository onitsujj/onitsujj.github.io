// Draggable 3D lanyard badge — React Three Fiber + rapier rope physics.
// Ported from the original esm.sh build to npm-vendored deps so it bundles
// locally and works everywhere (incl. Brave). Recolored to Obsidian + Cyan.
import React, { useRef, useState, useEffect } from "react";
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

/* ---------- card texture compositing (Obsidian + Cyan back) ---------- */
function buildCardTexture(imageSrc, cardColor) {
  return new Promise((resolve) => {
    const res = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = cardColor || "#1a1a1e";
    ctx.fillRect(0, 0, res, res);

    const drawBack = () => {
      const x0 = res / 2;
      // obsidian back panel
      ctx.fillStyle = "#141417";
      ctx.fillRect(x0, 0, res / 2, res);
      // inset hairline frame
      ctx.strokeStyle = "rgba(244,241,234,0.16)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 46, 46, res / 2 - 92, res - 92);
      // centered ring emblem — outer warm-white, inner cyan
      const cx = x0 + res / 4;
      const cy = res / 2;
      ctx.strokeStyle = "rgba(244,241,234,0.85)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, 96, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(28,189,212,0.55)";
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    const finish = () => {
      drawBack();
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

    if (!imageSrc) { finish(); return; }
    const img = new Image();
    img.onload = () => {
      // COVER the card front (left half), cropping overflow — no margin.
      const tw = res / 2, th = res;
      const ar = img.width / img.height;
      const tar = tw / th;
      let w, hh;
      if (ar > tar) { hh = th; w = th * ar; }
      else { w = tw; hh = tw / ar; }
      const x = (tw - w) / 2;
      const y = (th - hh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, res / 2, res);
      ctx.clip();
      ctx.drawImage(img, x, y, w, hh);
      ctx.restore();
      finish();
    };
    img.onerror = finish;
    img.src = imageSrc;
  });
}

/* ---------- physics band ---------- */
function Band({ cardImageSrc, clipColor, stringColor, maxSpeed = 50, minSpeed = 0 }) {
  const fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef();
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3();
  const segmentProps = { type: "dynamic", canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGlbUrl);
  const cardTexture = useTexture(cardImageSrc);
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

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((r) => r.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
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
      const cardRot = card.current.rotation();
      cq.set(cardRot.x, cardRot.y, cardRot.z, cardRot.w);
      eul.setFromQuaternion(cq);
      updateStrap(geo, curve.getPoints(STRAP_SEG), eul.y * STRAP_TWIST_GAIN);
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = "centripetal";

  return h(Fragment, null,
    h("group", { position: [0, 4, 0] },
      h(RigidBody, { ref: fixed, ...segmentProps, type: "fixed" }),
      h(RigidBody, { position: [0.5, 0, 0], ref: j1, ...segmentProps }, h(BallCollider, { args: [0.1] })),
      h(RigidBody, { position: [1, 0, 0], ref: j2, ...segmentProps }, h(BallCollider, { args: [0.1] })),
      h(RigidBody, { position: [1.5, 0, 0], ref: j3, ...segmentProps }, h(BallCollider, { args: [0.1] })),
      h(RigidBody, { position: [2, 0, 0], ref: card, ...segmentProps, type: dragged ? "kinematicPosition" : "dynamic" },
        h(CuboidCollider, { args: [0.8, 1.125, 0.01] }),
        h("group", {
          scale: 2.25,
          position: [0, -1.2, -0.05],
          onPointerOver: () => setHovered(true),
          onPointerOut: () => setHovered(false),
          onPointerUp: (e) => { e.target.releasePointerCapture(e.pointerId); setDragged(false); },
          onPointerDown: (e) => {
            e.target.setPointerCapture(e.pointerId);
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
      h("meshStandardMaterial", { color: stringColor, emissive: stringColor, emissiveIntensity: 0.22, side: THREE.DoubleSide, roughness: 0.62, metalness: 0.0, envMapIntensity: 0.5 })
    )
  );
}

/* ---------- app ---------- */
function LanyardApp({ image, cardColor, clipColor, strapColor, onReady }) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let cancelled = false;
    buildCardTexture(image, cardColor).then((u) => { if (!cancelled) setTex(u); });
    return () => { cancelled = true; };
  }, [image, cardColor]);

  // signal readiness ~2 frames after the card texture is built, so the
  // host can cross-fade out the static badge with content already on screen.
  useEffect(() => {
    if (!tex || !onReady) return;
    let raf2;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => onReady()); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [tex, onReady]);

  return h("div", { style: { width: "100%", height: "100%" } },
    h(Canvas, {
      camera: { position: [0, 0, 9.5], fov: 25 },
      gl: { alpha: true, preserveDrawingBuffer: true },
      dpr: [1, 2],
      resize: { debounce: 0, scroll: false },
      onCreated: ({ gl }) => gl.setClearColor(new THREE.Color(0), 0),
      style: { width: "100%", height: "100%", touchAction: "none" },
    },
      h("ambientLight", { intensity: 1.1 }),
      h(Physics, { gravity: [0, -40, 0], timeStep: 1 / 60 },
        tex && h(React.Suspense, { fallback: null },
          h(Band, { cardImageSrc: tex, clipColor, stringColor: strapColor }))
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
  if (root) return;
  root = createRoot(el);
  root.render(h(LanyardApp, props));
}

export function unmount() {
  if (root) { root.unmount(); root = null; }
}
