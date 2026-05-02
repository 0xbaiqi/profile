import * as THREE from 'three';
import { VerletSystem } from './VerletSystem';

export class MouseInteraction {
  private system: VerletSystem;
  private isDragging = false;
  private draggedParticles: Array<{ idx: number; weight: number }> = [];
  private dragPlane = new THREE.Plane();
  private dragPoint = new THREE.Vector3();
  private influenceRadius: number;

  constructor(system: VerletSystem) {
    this.system = system;
    this.influenceRadius = system.spacing * 3.5;
  }

  onPointerDown(intersection: THREE.Intersection): void {
    const hitPoint = intersection.point;

    // Find nearest particle and its neighborhood
    const { cols, rows } = this.system;
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < cols * rows; i++) {
      if (this.system.invMasses[i] === 0) continue;
      const [px, py, pz] = this.system.getParticlePosition(i);
      const dx = px - hitPoint.x;
      const dy = py - hitPoint.y;
      const dz = pz - hitPoint.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    // Collect neighborhood with distance-based weights
    this.draggedParticles = [];
    const [nx, ny, nz] = this.system.getParticlePosition(nearestIdx);
    const center = new THREE.Vector3(nx, ny, nz);

    for (let i = 0; i < cols * rows; i++) {
      if (this.system.invMasses[i] === 0) continue;
      const [px, py, pz] = this.system.getParticlePosition(i);
      const dist = center.distanceTo(new THREE.Vector3(px, py, pz));
      if (dist <= this.influenceRadius) {
        const weight = 1 - dist / this.influenceRadius;
        this.draggedParticles.push({ idx: i, weight: weight * weight });
      }
    }

    // Create drag plane facing camera (normal = world Z)
    this.dragPlane.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 0, 1),
      hitPoint
    );
    this.dragPoint.copy(hitPoint);
    this.isDragging = true;
  }

  onPointerMove(ray: THREE.Ray): void {
    if (!this.isDragging || this.draggedParticles.length === 0) return;

    const newPoint = new THREE.Vector3();
    ray.intersectPlane(this.dragPlane, newPoint);
    if (!newPoint) return;

    const delta = newPoint.clone().sub(this.dragPoint);

    for (const { idx, weight } of this.draggedParticles) {
      const [px, py, pz] = this.system.getParticlePosition(idx);
      this.system.setPosition(
        idx,
        px + delta.x * weight,
        py + delta.y * weight,
        pz + delta.z * weight
      );
    }

    this.dragPoint.copy(newPoint);
  }

  onPointerUp(): void {
    this.isDragging = false;
    this.draggedParticles = [];
  }

  get dragging(): boolean {
    return this.isDragging;
  }
}
