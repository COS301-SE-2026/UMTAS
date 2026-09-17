use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn slice_image_data_gpu(
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Result<js_sys::Array, JsValue> {
    let result_arr = js_sys::Array::new();

    return Ok(result_arr);
}
