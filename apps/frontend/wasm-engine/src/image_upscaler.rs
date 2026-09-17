use wasm_bindgen::prelude::*;

// wasm function to call
#[wasm_bindgen]
pub fn slice_image_data_gpu(
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Result<js_sys::Array, JsValue> {
    todo!("funtion to run from browser")
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

#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
pub struct SliceParms {
    pub src_width: u32,
    pub src_height: u32,
    pub crop_x: u32,
    pub crop_y: u32,
    pub scale_x: u32,
    pub scale_y: u32,
    pub slice_index: u32,
    pub _pad: u32, // gpu padding needed
}

// creates and returns the buffers needed for the compute
pub fn create_buffers(
    device: &wgpu::Device,
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Buffers {
    todo!("init Buffer struct ")
}

// needed to read the output to staging
pub async fn read_slices(
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    buffers: &Buffers,
) -> Result<js_sys::Array, JsValue> {
    todo!("copy output to staging buffer return uint arr")
}
