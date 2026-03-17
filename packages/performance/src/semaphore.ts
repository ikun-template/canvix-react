export class Semaphore {
  private current = 0;
  private waiting: (() => void)[] = [];

  constructor(private max: number) {}

  async acquire(): Promise<() => void> {
    if (this.current < this.max) {
      this.current++;
      return () => this.release();
    }

    return new Promise<() => void>(resolve => {
      this.waiting.push(() => {
        this.current++;
        resolve(() => this.release());
      });
    });
  }

  private release() {
    this.current--;
    if (this.waiting.length > 0) {
      this.waiting.shift()!();
    }
  }
}
