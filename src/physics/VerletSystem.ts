export interface Constraint {
  p1: number;
  p2: number;
  restLength: number;
  stiffness: number;
}

export class VerletSystem {
  readonly cols: number;
  readonly rows: number;
  readonly spacing: number;

  positions: Float32Array;
  prevPositions: Float32Array;
  accelerations: Float32Array;
  invMasses: Float32Array;

  private constraints: Constraint[] = [];

  readonly gravity = -9.8;
  readonly damping = 0.97;      // more energy loss, paper stops quicker
  readonly constraintIterations = 8;  // more iterations = stiffer/more stable

  constructor(cols: number, rows: number, spacing: number) {
    this.cols = cols;
    this.rows = rows;
    this.spacing = spacing;

    const count = cols * rows;
    this.positions = new Float32Array(count * 3);
    this.prevPositions = new Float32Array(count * 3);
    this.accelerations = new Float32Array(count * 3);
    this.invMasses = new Float32Array(count);

    this._initParticles();
    this._buildConstraints();
  }

  private _initParticles(): void {
    const { cols, rows, spacing } = this;
    const startX = -(cols - 1) * spacing * 0.5;
    const startY = (rows - 1) * spacing * 0.5;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const x = startX + col * spacing;
        const y = startY - row * spacing;
        const z = 0;

        this.positions[idx * 3 + 0] = x;
        this.positions[idx * 3 + 1] = y;
        this.positions[idx * 3 + 2] = z;
        this.prevPositions[idx * 3 + 0] = x;
        this.prevPositions[idx * 3 + 1] = y;
        this.prevPositions[idx * 3 + 2] = z;

        // Pin ENTIRE top row - not just corners
        if (row === 0) {
          this.invMasses[idx] = 0; // pinned
        } else {
          this.invMasses[idx] = 1.0 / 0.2; // mass = 0.2, very light thin paper
        }
      }
    }
  }

  private _buildConstraints(): void {
    const { cols, rows, spacing } = this;

    const addConstraint = (r1: number, c1: number, r2: number, c2: number, stiffness: number) => {
      if (r1 < 0 || r1 >= rows || c1 < 0 || c1 >= cols) return;
      if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) return;
      const p1 = r1 * cols + c1;
      const p2 = r2 * cols + c2;
      const dr = r2 - r1;
      const dc = c2 - c1;
      const restLength = Math.sqrt(dr * dr + dc * dc) * spacing;
      this.constraints.push({ p1, p2, restLength, stiffness });
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Structural: near-inextensible like paper
        addConstraint(row, col, row, col + 1, 0.99);
        addConstraint(row, col, row + 1, col, 0.99);
        // Shear: reduced to avoid diagonal bias/cloth look
        addConstraint(row, col, row + 1, col + 1, 0.6);
        addConstraint(row, col + 1, row + 1, col, 0.6);
        // Bending: high stiffness = paper resists folding
        addConstraint(row, col, row, col + 2, 0.85);
        addConstraint(row, col, row + 2, col, 0.85);
      }
    }
  }

  step(dt: number): void {
    const count = this.cols * this.rows;
    const dtSq = dt * dt;

    // Verlet integration
    for (let i = 0; i < count; i++) {
      if (this.invMasses[i] === 0) continue;
      const base = i * 3;

      const vx = (this.positions[base] - this.prevPositions[base]) * this.damping;
      const vy = (this.positions[base + 1] - this.prevPositions[base + 1]) * this.damping;
      const vz = (this.positions[base + 2] - this.prevPositions[base + 2]) * this.damping;

      this.prevPositions[base] = this.positions[base];
      this.prevPositions[base + 1] = this.positions[base + 1];
      this.prevPositions[base + 2] = this.positions[base + 2];

      this.positions[base] += vx + this.accelerations[base] * dtSq;
      this.positions[base + 1] += vy + (this.accelerations[base + 1] + this.gravity) * dtSq;
      this.positions[base + 2] += vz + this.accelerations[base + 2] * dtSq;
    }

    // Constraint solving
    for (let iter = 0; iter < this.constraintIterations; iter++) {
      for (const c of this.constraints) {
        const b1 = c.p1 * 3;
        const b2 = c.p2 * 3;
        const dx = this.positions[b2] - this.positions[b1];
        const dy = this.positions[b2 + 1] - this.positions[b1 + 1];
        const dz = this.positions[b2 + 2] - this.positions[b1 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1e-8) continue;

        const diff = (dist - c.restLength) / dist * c.stiffness;
        const totalInvMass = this.invMasses[c.p1] + this.invMasses[c.p2];
        if (totalInvMass === 0) continue;

        const w1 = this.invMasses[c.p1] / totalInvMass;
        const w2 = this.invMasses[c.p2] / totalInvMass;
        const cx = dx * diff * 0.5;
        const cy = dy * diff * 0.5;
        const cz = dz * diff * 0.5;

        this.positions[b1] += cx * w1;
        this.positions[b1 + 1] += cy * w1;
        this.positions[b1 + 2] += cz * w1;
        this.positions[b2] -= cx * w2;
        this.positions[b2 + 1] -= cy * w2;
        this.positions[b2 + 2] -= cz * w2;
      }
    }

    // Reset accelerations
    this.accelerations.fill(0);
  }

  applyForce(idx: number, fx: number, fy: number, fz: number): void {
    if (this.invMasses[idx] === 0) return;
    const mass = 1.0 / this.invMasses[idx];
    this.accelerations[idx * 3] += fx / mass;
    this.accelerations[idx * 3 + 1] += fy / mass;
    this.accelerations[idx * 3 + 2] += fz / mass;
  }

  // Set position directly (for drag)
  setPosition(idx: number, x: number, y: number, z: number): void {
    if (this.invMasses[idx] === 0) return;
    this.positions[idx * 3] = x;
    this.positions[idx * 3 + 1] = y;
    this.positions[idx * 3 + 2] = z;
  }

  // Zero out velocity for a particle (call after setting position for stable drag)
  zeroVelocity(idx: number): void {
    this.prevPositions[idx * 3] = this.positions[idx * 3];
    this.prevPositions[idx * 3 + 1] = this.positions[idx * 3 + 1];
    this.prevPositions[idx * 3 + 2] = this.positions[idx * 3 + 2];
  }

  getParticlePosition(idx: number): [number, number, number] {
    const b = idx * 3;
    return [this.positions[b], this.positions[b + 1], this.positions[b + 2]];
  }
}
