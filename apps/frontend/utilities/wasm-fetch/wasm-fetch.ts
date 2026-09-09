import init, { add, print_rust } from "@/../wasm-engine/pkg/wasm_engine";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function loadWasmEngine() {
  if (isInitialized) return { add };

  if (!initPromise) {
    initPromise = (async () => {
      // If your wasm file is placed in public/wasm/wasm_engine_bg.wasm,
      // pass the explicit path to init(). Otherwise, default init() looks
      // for it relative to the JS file location.
      await init();
      isInitialized = true;
    })();
  }

  await initPromise;
  return { add, print_rust };
}
