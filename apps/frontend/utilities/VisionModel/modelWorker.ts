import { DETECT_MESSAGE, PIXEL_PAYLOAD } from "./messageTypes";
import init, { slice_image_data } from "../../wasm-engine/pkg/wasm_engine";
import * as ort from "onnxruntime-web";

let wasmLoaded = false;
let DetectSession: ort.InferenceSession | null = null;

async function initWasm() {
  await init();
  wasmLoaded = true;
}
async function initDetection() {
  const fullUrl = `${location.origin}/models/yolov11n.onnx`;

  DetectSession = await ort.InferenceSession.create(fullUrl, {
    executionProviders: ["wgpu", "wasm"],
  });
}

function createSlices(payload: PIXEL_PAYLOAD) {
  const wasmPixels = new Uint8Array(
    payload.pixelData.buffer,
    payload.pixelData.byteOffset,
    payload.pixelData.byteLength,
  );

  return slice_image_data(
    wasmPixels,
    payload.width,
    payload.height,
  ) as Float32Array[];
}

async function runModel(slices: Float32Array[], payload: PIXEL_PAYLOAD) {
  const sliceHeight = payload.height / 2;
  const sliceWidth = payload.width / 2;
  const tensorShape = [1, 3, sliceHeight, sliceWidth];

  const inputName = DetectSession?.inputNames[0];
  const outputName = DetectSession?.outputNames[0];

  if (inputName && outputName) {
    const inferencePromises = slices.map(async (sliceData) => {
      const inputTensor = new ort.Tensor("float32", sliceData, tensorShape);
      const results = await DetectSession!.run({ [inputName]: inputTensor });
      return results[outputName].data;
    });

    return await Promise.all(inferencePromises);
  } else {
    throw Error("Input and output names not set");
  }
}

self.onmessage = async (event: MessageEvent) => {
  const message = event.data as DETECT_MESSAGE;

  if (message.eventType === "DETECT") {
    const payload = message.payload;
    if (!wasmLoaded) {
      await initWasm();
    }

    if (!DetectSession) {
      await initDetection();
    }

    const slices = createSlices(payload);

    try {
      runModel(slices, payload);
    } catch (err) {
      console.error(err);
    }
  }
};
