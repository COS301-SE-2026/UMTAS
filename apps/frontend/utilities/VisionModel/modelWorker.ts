import { DETECT_MESSAGE } from "./messageTypes";
import init, { slice_image_data } from "../../wasm-engine/pkg/wasm_engine";

self.onmessage = async (event: MessageEvent) => {
  const message = event.data as DETECT_MESSAGE;

  if (message.eventType === "DETECT") {
    const payload = message.payload;
    await init();

    const wasmPixels = new Uint8Array(
      payload.pixelData.buffer,
      payload.pixelData.byteOffset,
      payload.pixelData.byteLength,
    );

    const slices = slice_image_data(
      wasmPixels,
      payload.width,
      payload.height,
    ) as Float32Array[];
  }
};
