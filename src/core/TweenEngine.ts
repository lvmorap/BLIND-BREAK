export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    const adj = t - 1.5 / d1;
    return n1 * adj * adj + 0.75;
  } else if (t < 2.5 / d1) {
    const adj = t - 2.25 / d1;
    return n1 * adj * adj + 0.9375;
  } else {
    const adj = t - 2.625 / d1;
    return n1 * adj * adj + 0.984375;
  }
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function linear(t: number): number {
  return t;
}

export class Tween {
  private from: number;
  private to: number;
  private duration: number;
  private easingFn: (t: number) => number;
  private onUpdate: (value: number) => void;
  private elapsed: number = 0;

  constructor(
    from: number,
    to: number,
    duration: number,
    easingFn: (t: number) => number,
    onUpdate: (value: number) => void,
  ) {
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.easingFn = easingFn;
    this.onUpdate = onUpdate;
  }

  update(dt: number): boolean {
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easingFn(progress);
    const value = this.from + (this.to - this.from) * easedProgress;
    this.onUpdate(value);
    return progress >= 1;
  }

  static create(
    from: number,
    to: number,
    duration: number,
    easingFn: (t: number) => number,
    onUpdate: (value: number) => void,
  ): Tween {
    return new Tween(from, to, duration, easingFn, onUpdate);
  }
}

export class TweenManager {
  private tweens: Tween[] = [];

  add(tween: Tween): void {
    this.tweens.push(tween);
  }

  update(dt: number): void {
    this.tweens = this.tweens.filter((tween) => !tween.update(dt));
  }

  clear(): void {
    this.tweens = [];
  }
}
