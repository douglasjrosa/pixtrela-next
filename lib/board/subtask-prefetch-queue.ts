export const PREFETCH_MAX_IN_FLIGHT = 3;

export class LimitedPrefetchQueue {
  private inFlight = 0;
  private readonly pending: string[] = [];
  private readonly queued = new Set<string>();

  constructor(
    private readonly maxInFlight: number,
    private readonly run: (id: string) => Promise<void>,
  ) {}

  enqueue(id: string): void {
    if (this.queued.has(id)) return;
    this.queued.add(id);
    this.pending.push(id);
    this.pump();
  }

  private pump(): void {
    while (this.inFlight < this.maxInFlight && this.pending.length > 0) {
      const id = this.pending.shift();
      if (!id) return;
      this.inFlight += 1;
      void this.run(id).finally(() => {
        this.queued.delete(id);
        this.inFlight -= 1;
        this.pump();
      });
    }
  }
}
