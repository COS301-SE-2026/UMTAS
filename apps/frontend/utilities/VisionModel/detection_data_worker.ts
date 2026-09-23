import {
  DetectedPerson,
  PROCESS_DETECT_DATA_MESSAGE,
  RESULT_PROCESS_DETECT_DATA,
} from "./messageTypes";
import init, { infer_detection_data } from "@wasm/wasm_engine";

let wasmLoaded = false;

async function initWasm() {
  await init();
  wasmLoaded = true;
}

self.onmessage = async (event: MessageEvent) => {
  const message = event.data as PROCESS_DETECT_DATA_MESSAGE;

  if (message.eventType === "PROCESS_DETECT_DATA") {
    const payload = message.payload;
    const tTotalStart = performance.now();

    if (!wasmLoaded) {
      await initWasm();
    }

    const people = infer_detection_data(
      payload.sliced_results.slice(1),
      payload.sliced_results[0],
    );

    try {
      self.postMessage({
        eventType: "DETECT_DATA_PARSED",
        payload: JSON.parse(people) as DetectedPerson[],
      } as RESULT_PROCESS_DETECT_DATA);
    } catch (error) {
      console.error(error);
    }
  }
};
