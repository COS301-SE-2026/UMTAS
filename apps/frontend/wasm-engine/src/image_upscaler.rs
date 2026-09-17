use wasm_bindgen::prelude::*;
use wgpu::util::DeviceExt;

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
pub struct slice_parms {
    pub src_width: u32,
    pub src_height: u32,
    pub crop_x: u32,
    pub crop_y: u32,
    pub scale_x: f32,
    pub scale_y: f32,
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
    // input buffer
    let input_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("INPUT_PIXEL_DATA"),
        contents: pixel_data,
        // compute shader can read == STORAGE
        // data outside gpu can init == COPY_DST
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
    });

    let src_w = width as u32;
    let src_h = width as u32;
    let scale_dbl_x = 1280.0 / src_w as f32;
    let scale_dbl_y = 1280.0 / src_h as f32;

    let slice_params = [
        // full image
        slice_parms {
            src_width: src_w,
            src_height: src_h,
            crop_x: 0,
            crop_y: 0,
            scale_x: 640.0 / src_w as f32,
            scale_y: 640.0 / src_h as f32,
            slice_index: 0,
            _pad: 0,
        },
        // Top left
        slice_parms {
            src_width: src_w,
            src_height: src_h,
            crop_x: 0,
            crop_y: 0,
            scale_x: scale_dbl_x,
            scale_y: scale_dbl_y,
            slice_index: 1,
            _pad: 0,
        },
        // top right
        slice_parms {
            src_width: src_w,
            src_height: src_h,
            crop_x: 640,
            crop_y: 0,
            scale_x: scale_dbl_x,
            scale_y: scale_dbl_y,
            slice_index: 2,
            _pad: 0,
        },
        // bottom left
        slice_parms {
            src_width: src_w,
            src_height: src_h,
            crop_x: 0,
            crop_y: 640,
            scale_x: scale_dbl_x,
            scale_y: scale_dbl_y,
            slice_index: 3,
            _pad: 0,
        },
        // bottom right
        slice_parms {
            src_width: src_w,
            src_height: src_h,
            crop_x: 640,
            crop_y: 640,
            scale_x: scale_dbl_x,
            scale_y: scale_dbl_y,
            slice_index: 4,
            _pad: 0,
        },
    ];
    let params_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("PARAMS_BUFFER"),
        contents: bytemuck::cast_slice(&slice_params),
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
    });

    let total_output_size = (5 * 640 * 640 * 4) as wgpu::BufferAddress;

    let output_buffer = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("OUTPUT_DATA"),
        size: total_output_size,
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
        mapped_at_creation: false,
    });

    let staging_buffer = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("STAGING_BUFFER"),
        size: total_output_size,
        // map read lets me read from gpu
        usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
        mapped_at_creation: false,
    });

    return Buffers {
        input_buffer,
        output_buffer,
        staging_buffer,
        params_buffer: params_buffer,
    };
}

pub fn run_upscaler(device: &wgpu::Device, queue: &wgpu::Queue, buffers: &Buffers) {
    
}

// needed to read the output to staging
pub async fn read_slices(
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    buffers: &Buffers,
) -> Result<js_sys::Array, JsValue> {
    todo!("copy output to staging buffer return uint arr")
}
