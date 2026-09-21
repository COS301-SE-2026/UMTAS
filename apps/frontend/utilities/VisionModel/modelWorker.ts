/// <reference lib="webworker" />
import {
  DETECT_DATA_MESSAGE,
  DETECT_MESSAGE,
  PIXEL_PAYLOAD,
} from "./messageTypes";
import init, {
  slice_image_data,
  slice_image_data_gpu,
} from "../../wasm-engine/pkg/wasm_engine";
import * as ort from "onnxruntime-web";

let wasmLoaded = false;
let DetectSession: ort.InferenceSession | null = null;

async function initWasm() {
  await init();
  wasmLoaded = true;
}
async function initDetection() {
  const fullUrl = `${location.origin}/models/yolo26n.onnx`;

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
    const sliceStart = performance.now();
    const inputTensor = new ort.Tensor("float32", slices[i], tensorShape);
    const results = await DetectSession!.run({ [inputName]: inputTensor });
    const sliceDuration = (performance.now() - sliceStart) / 1000;

    if (i != 1)
      console.log(`-> Slice ${i + 1} took: ${sliceDuration.toFixed(3)}s`);
    else
      console.log(`-> full image  ${i + 1} took: ${sliceDuration.toFixed(3)}s`);
    resultsArray.push(results[outputName].data as Float32Array);
  }

  return resultsArray;
}
self.onmessage = async (event: MessageEvent) => {
  const message = event.data as DETECT_MESSAGE;

  if (message.eventType === "DETECT") {
    const payload = message.payload;
    const tTotalStart = performance.now();

    if (!wasmLoaded) {
      const tWasm = performance.now();
      await initWasm();
      console.log(
        `[Worker] Init WASM took: ${((performance.now() - tWasm) / 1000).toFixed(3)}s`,
      );
    }

    if (!DetectSession) {
      const tSession = performance.now();
      await initDetection();
      console.log(
        `[Worker] Init Detection Session took: ${((performance.now() - tSession) / 1000).toFixed(3)}s`,
      );
    }
    console.log("got to before taking slices");
    const tSliceStart = performance.now();
    const slices = await createSlices(payload);
    console.log(
      `[Worker] createSlices took: ${((performance.now() - tSliceStart) / 1000).toFixed(3)}s`,
    );

    try {
      const tRunStart = performance.now();
      const results = await runModel(slices, payload);
      console.log(
        `[Worker] runModel total took: ${((performance.now() - tRunStart) / 1000).toFixed(3)}s`,
      );

      const transferBuffers = results.map(
        (tensorData) => (tensorData as Float32Array).buffer,
      );

      self.postMessage(
        {
          eventType: "DETECT_DATA",
          payload: {
            results: results,
          },
        } as DETECT_DATA_MESSAGE,
        transferBuffers,
      );

      console.log(
        `[Worker] Total message cycle took: ${((performance.now() - tTotalStart) / 1000).toFixed(3)}s`,
      );
    } catch (err) {
      console.error(err);
    }
  }
};
