import {
  DetectedPerson,
  PROCESS_DETECT_DATA_MESSAGE,
  RESULT_PROCESS_POSE_DATA,
} from "./messageTypes";

class Pose_Data_Manager {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {}
  public start() {
    if (typeof window === "undefined") return;

    if (!this.worker) {
      this.worker = new Worker(
        new URL("./pose_data_worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
      this.isProcessing = false;
    }
  }
  public run(sliced_results: Float32Array[]): Promise<DetectedPerson[] | null> {
    if (this.isProcessing || !this.worker) {
      return Promise.resolve(null);
    }
    this.isProcessing = true;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        const message = event.data as RESULT_PROCESS_POSE_DATA;
        if (message.eventType === "POSE_DATA_PARSED") {
          this.worker?.removeEventListener("message", handleMessage);
          this.isProcessing = false;

          const durationSeconds = (performance.now() - startTime) / 1000;
          console.log(
            `POSE data parsing pipeline took: ${durationSeconds.toFixed(3)}s`,
          );

          resolve(null); // TODO
        }
      };
      this.worker?.addEventListener("message", handleMessage);

      const detectMessage: PROCESS_DETECT_DATA_MESSAGE = {
        eventType: "PROCESS_DETECT_DATA",
        payload: {
          sliced_results: sliced_results,
        },
      };

      const transferBuffers = sliced_results.map((arr) => arr.buffer);
      this.worker?.postMessage(detectMessage, transferBuffers);
    });
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export const pose_data_manager = new Pose_Data_Manager();
