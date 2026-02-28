export interface ArenaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'spark';
  gravity: number;
}

export interface EmitOptions {
  color?: string;
  size?: number;
  speed?: number;
  shape?: 'circle' | 'square' | 'spark';
  gravity?: number;
  life?: number;
}

const MAX_PARTICLES = 200;

class ParticleSystemImpl {
  private particles: ArenaParticle[] = [];

  emit(x: number, y: number, count: number, options: EmitOptions = {}): void {
    const {
      color = '#ffffff',
      size = 3,
      speed = 100,
      shape = 'circle',
      gravity = 0,
      life = 0.6,
    } = options;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        color,
        size: size * (0.5 + Math.random() * 0.5),
        shape,
        gravity,
      });
    }
  }

  burst(x: number, y: number, count: number, color: string): void {
    this.emit(x, y, count, { color, speed: 200, size: 4, life: 0.5 });
  }

  trail(x: number, y: number, color: string): void {
    this.emit(x, y, 1, { color, speed: 20, size: 2, life: 0.3, shape: 'circle' });
  }

  spark(x: number, y: number, color: string): void {
    this.emit(x, y, 3, { color, speed: 150, size: 2, life: 0.4, shape: 'spark' });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.save();
        const angle = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillRect(-p.size * 2, -0.5, p.size * 4, 1);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.particles = [];
  }
}

export const particleSystem = new ParticleSystemImpl();
