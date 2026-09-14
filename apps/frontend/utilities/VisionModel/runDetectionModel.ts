export function RunDetectionModelWorker(
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const worker = new Worker(new URL("./modelWorker.ts", import.meta.url), {
    type: "module",
  });
}
