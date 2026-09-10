use tract::prelude::*;
use wasm_bindgen::prelude::*;
tract::impl_ndarray_interop!();

#[wasm_bindgen]
pub struct YoloWasmEngine {
    model: Runnable,
}

#[wasm_bindgen]
impl YoloWasmEngine {
    pub fn new(modelBytes: &[u8]) -> Result<YoloWasmEngine, JsValue> {}
}
