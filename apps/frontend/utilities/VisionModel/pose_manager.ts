import {
  MessageType,
  POSE_DATA_MESSAGE,
  POSE_MESSAGE,
  VisionModelSize,
} from "./messageTypes";

class PoseManager {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {}
  public start() {
    if (typeof window === "undefined") return;

    if (!this.worker) {
      this.worker = new Worker(new URL("./pose_worker.ts", import.meta.url), {
        type: "module",
      });
      this.isProcessing = false;
    }
  }
  public run(
    PixelData: Uint8ClampedArray,
    width: number,
    height: number,
    modelSize: VisionModelSize,
  ): Promise<Float32Array[] | null> {
    if (this.isProcessing || !this.worker) {
      return Promise.resolve(null);
    }
    this.isProcessing = true;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        const type = event.data.eventType as MessageType;
        if (type === "POSE_DATA") {
          const message = event.data as POSE_DATA_MESSAGE;
          this.worker?.removeEventListener("message", handleMessage);
          this.isProcessing = false;

          const durationSeconds = (performance.now() - startTime) / 1000;

          resolve(message.payload.results);
        }
      };
      this.worker?.addEventListener("message", handleMessage);

      const detectMessage: POSE_MESSAGE = {
        eventType: "POSE",
        payload: {
          height: height,
          pixelData: PixelData,
          width: width,
          modelSize: modelSize,
        },
      };

      this.worker?.postMessage(detectMessage, [PixelData.buffer]);
    });
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export const pose_Manager = new PoseManager();
