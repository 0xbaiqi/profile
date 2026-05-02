import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VerletSystem } from '../physics/VerletSystem';
import { MouseInteraction } from '../physics/MouseInteraction';
import { createReceiptTexture } from '../texture/ReceiptTexture';

const COLS = 16;
const ROWS = 42;
const SPACING = 0.075;

/**
 * Compute smooth surface normals using central differences across the particle grid.
 * This avoids the cloth-like cross-hatch lighting artifact from per-triangle normals.
 * For each particle, the normal is the cross product of its horizontal and vertical
 * neighbor vectors — smooth curvature, no diagonal bias.
 */
function computeGridNormals(positions: Float32Array, normals: Float32Array, cols: number, rows: number) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;

      // Clamp neighbors to grid bounds
      const cL = Math.max(0, col - 1);
      const cR = Math.min(cols - 1, col + 1);
      const rU = Math.max(0, row - 1);
      const rD = Math.min(rows - 1, row + 1);

      const iL = row * cols + cL;
      const iR = row * cols + cR;
      const iU = rU * cols + col;
      const iD = rD * cols + col;

      // Horizontal tangent (right - left)
      const tx = positions[iR * 3]     - positions[iL * 3];
      const ty = positions[iR * 3 + 1] - positions[iL * 3 + 1];
      const tz = positions[iR * 3 + 2] - positions[iL * 3 + 2];

      // Vertical tangent (down - up, world Y decreases down the receipt)
      const bx = positions[iD * 3]     - positions[iU * 3];
      const by = positions[iD * 3 + 1] - positions[iU * 3 + 1];
      const bz = positions[iD * 3 + 2] - positions[iU * 3 + 2];

      // Normal = horizontal × vertical
      let nx = ty * bz - tz * by;
      let ny = tz * bx - tx * bz;
      let nz = tx * by - ty * bx;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-6) {
        nx /= len; ny /= len; nz /= len;
      } else {
        nx = 0; ny = 0; nz = 1;
      }

      normals[idx * 3]     = nx;
      normals[idx * 3 + 1] = ny;
      normals[idx * 3 + 2] = nz;
    }
  }
}

export default function ReceiptMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const systemRef = useRef<VerletSystem>(new VerletSystem(COLS, ROWS, SPACING));
  const mouseRef = useRef<MouseInteraction>(new MouseInteraction(systemRef.current));
  const { gl, camera } = useThree();

  const texture = useMemo(() => createReceiptTexture(), []);

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

    // Pre-allocate normals buffer
    const normals = new Float32Array(count * 3);
    normals.fill(0);
    for (let i = 0; i < count; i++) normals[i * 3 + 2] = 1; // default +Z
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

  // Global pointer events so drag works even outside the mesh bounds
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
    systemRef.current.step(0.016);

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const normAttr = geometry.attributes.normal as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const normArr = normAttr.array as Float32Array;

    // Sync positions
    const count = COLS * ROWS;
    for (let i = 0; i < count; i++) {
      posArr[i * 3]     = systemRef.current.positions[i * 3];
      posArr[i * 3 + 1] = systemRef.current.positions[i * 3 + 1];
      posArr[i * 3 + 2] = systemRef.current.positions[i * 3 + 2];
    }
    posAttr.needsUpdate = true;

    // Smooth grid-based normals — eliminates cloth-like cross-hatch shading
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
      {/* Thermal paper: bright white base, matte surface, tiny specular like coated paper */}
      <meshPhongMaterial
        map={texture}
        side={THREE.DoubleSide}
        color="#ffffff"
        specular="#aaaaaa"
        shininess={8}
        reflectivity={0.05}
      />
    </mesh>
  );
}
