export interface IGame {
  init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  destroy(): void;
  getWinner(): 1 | 2 | null;
  isFinished(): boolean;
}

export interface GameInfo {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  factory: () => IGame;
}
