import {
  DetectedPerson,
  DetectedPersonPose,
  PROCESS_POSE_DATA_MESSAGE,
  RESULT_PROCESS_POSE_DATA,
} from "./messageTypes";
import init, { infer_pose_data } from "../../wasm-engine/pkg/wasm_engine";

let wasmLoaded = false;

async function initWasm() {
  await init();
  wasmLoaded = true;
}

self.onmessage = async (event: MessageEvent) => {
  const message = event.data as PROCESS_POSE_DATA_MESSAGE;

  if (message.eventType === "PROCESS_POSE_DATA") {
    const payload = message.payload;
    const tTotalStart = performance.now();

    if (!wasmLoaded) {
      await initWasm();
    }

    const tSliceStart = performance.now();
    const people = infer_pose_data(
      payload.sliced_results.slice(1),
      payload.sliced_results[0],
    );

    try {
      self.postMessage({
        eventType: "POSE_DATA_PARSED",
        payload: JSON.parse(people) as DetectedPersonPose[],
      } as RESULT_PROCESS_POSE_DATA);
    } catch (error) {
      console.error(error);
    }
  }
};
