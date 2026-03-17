export class IdleQueue {
  private queue: (() => void)[] = [];
  private scheduled = false;

  enqueue(task: () => void) {
    this.queue.push(task);
    this.schedule();
  }

  clear() {
    this.queue = [];
  }

  get pending() {
    return this.queue.length;
  }

  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    requestIdleCallback(deadline => {
      this.scheduled = false;
      while (this.queue.length > 0 && deadline.timeRemaining() > 0) {
        this.queue.shift()!();
      }
      if (this.queue.length > 0) this.schedule();
    });
  }
}
