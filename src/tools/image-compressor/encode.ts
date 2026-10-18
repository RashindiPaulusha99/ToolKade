import { encodeWith, type EncodeJob, type EncodeOutput } from './encode-core';

/*
 * Encodes one image, in a Web Worker when the browser supports OffscreenCanvas, otherwise on the
 * main thread. The worker module is only fetched when the first image is processed.
 */

type WorkerReply = { id: number; ok: true; output: EncodeOutput } | { id: number; ok: false; error: string };

let worker: Worker | null | undefined;
let nextId = 1;
const pending = new Map<number, { resolve: (o: EncodeOutput) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return (worker = null);
  try {
    worker = new Worker(new URL('./encode.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      const job = pending.get(reply.id);
      if (!job) return;
      pending.delete(reply.id);
      if (reply.ok) job.resolve(reply.output);
      else job.reject(new Error(reply.error));
    };
    worker.onerror = () => {
      // If the worker cannot start, fail the waiting jobs and fall back to the main thread from now on.
      for (const job of pending.values()) job.reject(new Error('Could not process this image.'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function encodeImage(job: EncodeJob): Promise<EncodeOutput> {
  const w = getWorker();
  if (!w) {
    return encodeWith(
      (width, height) => Object.assign(document.createElement('canvas'), { width, height }),
      job,
    );
  }
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, ...job });
  });
}
