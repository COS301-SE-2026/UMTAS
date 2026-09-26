/// <reference lib="webworker" />
import { PIXEL_PAYLOAD, POSE_DATA_MESSAGE, POSE_MESSAGE } from "./messageTypes";
import init, { slice_image_data_gpu } from "@wasm/wasm_engine";
import * as ort from "onnxruntime-web";

let wasmLoaded = false;
let DetectSession: ort.InferenceSession | null = null;

async function initWasm() {
  await init();
  wasmLoaded = true;
}
async function initDetection() {
  const fullUrl = `${location.origin}/models/yolo26n-pose.onnx`;

  DetectSession = await ort.InferenceSession.create(fullUrl, {
    executionProviders: ["webgpu", "wasm"],
  });
}
async function createSlices(payload: PIXEL_PAYLOAD): Promise<Float32Array[]> {
  const wasmPixels = new Uint8Array(
    payload.pixelData.buffer,
    payload.pixelData.byteOffset,
    payload.pixelData.byteLength,
  );

  const slices = await slice_image_data_gpu(
    wasmPixels,
    payload.width,
    payload.height,
  );

  return slices as Float32Array[];
}

async function runModel(slices: Float32Array[], payload: PIXEL_PAYLOAD) {
  const tensorShape = [1, 3, 640, 640];
  const inputName = DetectSession?.inputNames[0];
  const outputName = DetectSession?.outputNames[0];

  if (!inputName || !outputName) {
    throw Error("Input and output names not set");
  }

  const resultsArray: Float32Array[] = [];

  for (let i = 0; i < slices.length; i++) {
    const inputTensor = new ort.Tensor("float32", slices[i], tensorShape);
    const results = await DetectSession!.run({ [inputName]: inputTensor });

    resultsArray.push(results[outputName].data as Float32Array);
  }

  return resultsArray;
}
self.onmessage = async (event: MessageEvent) => {
  const message = event.data as POSE_MESSAGE;

  if (message.eventType === "POSE") {
    const payload = message.payload;

    if (!wasmLoaded) {
      await initWasm();
    }

    if (!DetectSession) {
      await initDetection();
    }

    const slices = await createSlices(payload);

    try {
      const results = await runModel(slices, payload);

      const transferBuffers = results.map(
        (tensorData) => (tensorData as Float32Array).buffer,
      );

      self.postMessage(
        {
          eventType: "POSE_DATA",
          payload: {
            results: results,
          },
        } as POSE_DATA_MESSAGE,
        transferBuffers,
      );
    } catch (err) {
      console.error(err);
    }
  }
};
