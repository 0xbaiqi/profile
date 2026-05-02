import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VerletSystem } from '../physics/VerletSystem';
import { MouseInteraction } from '../physics/MouseInteraction';
import { createWantedPosterTexture } from '../texture/WantedPosterTexture';

// matches canvas 600×1175 — width: 21*0.082=1.722, height: 41*0.082=3.362
const COLS = 22;
const ROWS = 42;
const SPACING = 0.082;

/**
 * Smooth central-difference normals — no cloth-like cross-hatch artifact.
 */
function computeGridNormals(
  positions: Float32Array,
  normals: Float32Array,
  cols: number,
  rows: number
) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;

      const cL = Math.max(0, col - 1);
      const cR = Math.min(cols - 1, col + 1);
      const rU = Math.max(0, row - 1);
      const rD = Math.min(rows - 1, row + 1);

      const iL = row * cols + cL;
      const iR = row * cols + cR;
      const iU = rU * cols + col;
      const iD = rD * cols + col;

      const tx = positions[iR * 3]     - positions[iL * 3];
      const ty = positions[iR * 3 + 1] - positions[iL * 3 + 1];
      const tz = positions[iR * 3 + 2] - positions[iL * 3 + 2];

      const bx = positions[iD * 3]     - positions[iU * 3];
      const by = positions[iD * 3 + 1] - positions[iU * 3 + 1];
      const bz = positions[iD * 3 + 2] - positions[iU * 3 + 2];

      let nx = ty * bz - tz * by;
      let ny = tz * bx - tx * bz;
      let nz = tx * by - ty * bx;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-6) { nx /= len; ny /= len; nz /= len; }
      else { nx = 0; ny = 0; nz = 1; }

      normals[idx * 3]     = nx;
      normals[idx * 3 + 1] = ny;
      normals[idx * 3 + 2] = nz;
    }
  }
}

export default function WantedPosterMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  // Poster physics: thick parchment — heavier, stiffer than thermal paper
  const systemRef = useRef<VerletSystem>(new VerletSystem(COLS, ROWS, SPACING));
  const mouseRef = useRef<MouseInteraction>(new MouseInteraction(systemRef.current));
  const { gl, camera } = useThree();

  // Wind burst state: triggers every 3-5 s
  const windRef = useRef({
    elapsed: 0,
    nextWindAt: 3 + Math.random() * 2,
    active: false,
    windStart: 0,
    windDuration: 0,
  });

  const texture = useMemo(() => createWantedPosterTexture(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const system = systemRef.current;
    const count = COLS * ROWS;

    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = system.positions[i * 3];
      positions[i * 3 + 1] = system.positions[i * 3 + 1];
      positions[i * 3 + 2] = system.positions[i * 3 + 2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const normals = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) normals[i * 3 + 2] = 1;
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    const uvs = new Float32Array(count * 2);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        uvs[idx * 2]     = col / (COLS - 1);
        uvs[idx * 2 + 1] = 1 - row / (ROWS - 1);
      }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const indices: number[] = [];
    for (let row = 0; row < ROWS - 1; row++) {
      for (let col = 0; col < COLS - 1; col++) {
        const a = row * COLS + col;
        const b = a + 1;
        const c = a + COLS;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
    geo.setIndex(indices);
    return geo;
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = 'grab';
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const onMove = (e: PointerEvent) => {
      if (!mouseRef.current.dragging) return;
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      mouseRef.current.onPointerMove(raycaster.ray);
    };
    const onUp = () => { mouseRef.current.onPointerUp(); canvas.style.cursor = 'grab'; };
    const onDown = () => { canvas.style.cursor = 'grabbing'; };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerdown', onDown);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerdown', onDown);
    };
  }, [gl, camera]);

  useFrame(() => {
    const w = windRef.current;
    w.elapsed += 0.016;

    // Trigger a new wind burst
    if (!w.active && w.elapsed >= w.nextWindAt) {
      w.active = true;
      w.windStart = w.elapsed;
      w.windDuration = 0.55 + Math.random() * 0.35;
    }

    // Apply wind forces during burst
    if (w.active) {
      const t = (w.elapsed - w.windStart) / w.windDuration;
      if (t >= 1) {
        w.active = false;
        w.nextWindAt = w.elapsed + 3 + Math.random() * 2;
      } else {
        const strength = Math.sin(t * Math.PI) * 2;
        const system = systemRef.current;
        for (let i = 0; i < COLS * ROWS; i++) {
          if (system.invMasses[i] === 0) continue;
          const row = Math.floor(i / COLS);
          const rowFactor = (row / (ROWS - 1)) * 0.85 + 0.15; // stronger at bottom
          system.applyForce(i, strength * rowFactor, 0, strength * rowFactor * 0.25);
        }
      }
    }

    systemRef.current.step(0.016);

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const normAttr = geometry.attributes.normal as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const normArr = normAttr.array as Float32Array;

    const count = COLS * ROWS;
    for (let i = 0; i < count; i++) {
      posArr[i * 3]     = systemRef.current.positions[i * 3];
      posArr[i * 3 + 1] = systemRef.current.positions[i * 3 + 1];
      posArr[i * 3 + 2] = systemRef.current.positions[i * 3 + 2];
    }
    posAttr.needsUpdate = true;
    computeGridNormals(posArr, normArr, COLS, ROWS);
    normAttr.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        mouseRef.current.onPointerDown(e);
      }}
    >
      {/* Thick parchment: warm tint, subtle sheen like aged paper */}
      <meshPhongMaterial
        map={texture}
        side={THREE.DoubleSide}
        color="#f5e8c0"
        specular="#7a5010"
        shininess={10}
      />
    </mesh>
  );
}
