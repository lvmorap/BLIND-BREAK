const MAX_DISPLACEMENT = 12;

interface ShakeOffset {
  ox: number;
  oy: number;
}

class ScreenShakeImpl {
  private intensity: number = 0;
  private duration: number = 0;
  private elapsed: number = 0;

  trigger(intensity: number, duration: number): void {
    // Use maximum, not cumulative
    this.intensity = Math.min(Math.max(this.intensity, intensity), MAX_DISPLACEMENT);
    this.duration = Math.max(this.duration - this.elapsed, duration);
    this.elapsed = 0;
  }

  update(dt: number): ShakeOffset {
    if (this.duration <= 0) {
      return { ox: 0, oy: 0 };
    }

    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.reset();
      return { ox: 0, oy: 0 };
    }

    const remaining = 1 - this.elapsed / this.duration;
    const currentIntensity = this.intensity * remaining;
    const ox = (Math.random() * 2 - 1) * currentIntensity;
    const oy = (Math.random() * 2 - 1) * currentIntensity;
    return { ox, oy };
  }

  reset(): void {
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
  }
}

export const screenShake = new ScreenShakeImpl();
