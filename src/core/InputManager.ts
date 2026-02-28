export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action1: boolean;
  action2: boolean;
}

export class InputManager {
  private keysDown: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private justReleasedKeys: Set<string> = new Set();
  private onKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private onKeyUp: ((e: KeyboardEvent) => void) | null = null;

  init(): void {
    this.onKeyDown = (e: KeyboardEvent): void => {
      if (!this.keysDown.has(e.code)) {
        this.justPressedKeys.add(e.code);
      }
      this.keysDown.add(e.code);
    };

    this.onKeyUp = (e: KeyboardEvent): void => {
      this.keysDown.delete(e.code);
      this.justReleasedKeys.add(e.code);
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  destroy(): void {
    if (this.onKeyDown) {
      document.removeEventListener('keydown', this.onKeyDown);
    }
    if (this.onKeyUp) {
      document.removeEventListener('keyup', this.onKeyUp);
    }
    this.onKeyDown = null;
    this.onKeyUp = null;
    this.keysDown.clear();
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }

  isDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  justPressed(key: string): boolean {
    return this.justPressedKeys.has(key);
  }

  justReleased(key: string): boolean {
    return this.justReleasedKeys.has(key);
  }

  getPlayer1(): PlayerInput {
    return {
      up: this.isDown('KeyW'),
      down: this.isDown('KeyS'),
      left: this.isDown('KeyA'),
      right: this.isDown('KeyD'),
      action1: this.justPressed('KeyF'),
      action2: this.justPressed('KeyG'),
    };
  }

  getPlayer2(): PlayerInput {
    return {
      up: this.isDown('ArrowUp'),
      down: this.isDown('ArrowDown'),
      left: this.isDown('ArrowLeft'),
      right: this.isDown('ArrowRight'),
      action1: this.justPressed('ShiftRight'),
      action2: this.justPressed('Enter'),
    };
  }

  update(): void {
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }

  reset(): void {
    this.keysDown.clear();
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }
}
