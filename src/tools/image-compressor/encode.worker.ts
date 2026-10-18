/// <reference lib="webworker" />
import { encodeWith, type EncodeJob } from './encode-core';

// Runs image encoding off the main thread so the page stays responsive during large batches.
self.onmessage = async (event: MessageEvent<EncodeJob & { id: number }>) => {
  const { id, ...job } = event.data;
  try {
    const output = await encodeWith((w, h) => new OffscreenCanvas(w, h), job);
    self.postMessage({ id, ok: true, output });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Could not process this image.',
    });
  }
};
