import type Clutter from '@girs/clutter-13';

export function wiggle(
  actor: Clutter.Actor,
  { offset, duration, wiggleCount }: { offset?: number; duration?: number; wiggleCount?: number },
): void;
