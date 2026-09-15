import {
  DETECT_DATA_MESSAGE,
  DETECT_MESSAGE,
  MessageType,
} from "./messageTypes";

class Detection_Data_Manager {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {}
  public start() {
    if (typeof window === "undefined") return;

    if (!this.worker) {
      this.worker = new Worker(new URL("./modelWorker.ts", import.meta.url), {
        type: "module",
      });
      this.isProcessing = false;
    }
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
    const startTime = performance.now();

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        const type = event.data.eventType as MessageType;
        if (type === "DETECT_DATA") {
          const message = event.data as DETECT_DATA_MESSAGE;
          this.worker?.removeEventListener("message", handleMessage);
          this.isProcessing = false;

          const durationSeconds = (performance.now() - startTime) / 1000;
          console.log(
            `Detection pipeline took: ${durationSeconds.toFixed(3)}s`,
          );

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

export const detection_data_manager = new Detection_Data_Manager();
