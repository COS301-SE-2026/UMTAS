import {
  DetectedPerson,
  PROCESS_DETECT_DATA_MESSAGE,
  RESULT_PROCESS_DETECT_DATA,
} from "./messageTypes";
import init, { infer_detection_data } from "../../wasm-engine/pkg/wasm_engine";

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
      const tWasm = performance.now();
      await initWasm();
      console.log(
        `[Worker DATA PROCESSOR] Init WASM took: ${((performance.now() - tWasm) / 1000).toFixed(3)}s`,
      );
    }

    const tSliceStart = performance.now();

    const people = infer_detection_data(
      payload.sliced_results.slice(1),
      payload.sliced_results[0],
    );

    console.log(
      `[Worker DATA PROCESSOR] parse People took: ${((performance.now() - tSliceStart) / 1000).toFixed(3)}s`,
    );

    try {
      self.postMessage({
        eventType: "DETECT_DATA_PARSED",
        payload: JSON.parse(people) as DetectedPerson[],
      } as RESULT_PROCESS_DETECT_DATA);
    } catch (error) {
      console.error(error);
    }

    console.log(
      `[Worker DATA PROCESSOR] Total data process cycle took: ${((performance.now() - tTotalStart) / 1000).toFixed(3)}s`,
    );
  }
};
