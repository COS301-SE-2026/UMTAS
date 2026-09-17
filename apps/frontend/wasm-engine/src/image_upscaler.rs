use wasm_bindgen::prelude::*;
use wgpu::util::DeviceExt;

#[wasm_bindgen]
pub fn slice_image_data_gpu(
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Result<js_sys::Array, JsValue> {
    let result_arr = js_sys::Array::new();

    return Ok(result_arr);
}

// Buffer setup
pub struct Buffers {
    // where we put raw pixel data
    pub input_buffer: wgpu::Buffer,
    // where we put the slice
    pub output_buffer: wgpu::Buffer,
    // A map read buffer we use to get data from gpu to wasm
    pub staging_buffer: wgpu::Buffer,
    // parms needed to make width height
    pub params_buffer: wgpu::Buffer,
}
