import {
  DETECT_DATA_MESSAGE,
  DETECT_MESSAGE,
  MessageType,
} from "./messageTypes";

class DetectionManager {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {
    this.worker = new Worker(new URL("./modelWorker.ts", import.meta.url), {
      type: "module",
    });
  }

  public run(
    PixelData: Uint8ClampedArray,
    width: number,
    height: number,
  ): Promise<Float32Array[] | null> {
    if (this.isProcessing || !this.worker) {
      return Promise.resolve(null);
    }
    this.isProcessing = true;

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        const type = event.data.type as MessageType;
        if (type === "DETECT_DATA") {
          const message = event.data as DETECT_DATA_MESSAGE;
          this.worker?.removeEventListener("message", handleMessage);
          this.isProcessing = false;
          resolve(message.payload.results);
        }
      };
      this.worker?.addEventListener("message", handleMessage);

      const detectMessage: DETECT_MESSAGE = {
        eventType: "DETECT",
        payload: {
          height: height,
          pixelData: PixelData,
          width: width,
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

export const detectionManager = new DetectionManager();
