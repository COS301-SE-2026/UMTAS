class DetectionManager {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {
    this.worker = new Worker(new URL("./modelWorker.ts", import.meta.url), {
      type: "module",
    });
  }

  public run(PixelData: Uint8ClampedArray, width: number, height: number) {}
}
