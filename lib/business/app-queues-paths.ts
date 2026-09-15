/** Client-safe URL builders for the web staff queues area. */

export function appQueuesPath(): string {
  return "/queues";
}

export function appQueueColaboratorPath(colaboratorId: string): string {
  return `/queues/${colaboratorId}`;
}
