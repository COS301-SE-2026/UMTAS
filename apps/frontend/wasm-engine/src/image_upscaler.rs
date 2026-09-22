use wasm_bindgen::prelude::*;
use wgpu::util::DeviceExt;
// wasm function to call
#[wasm_bindgen]
pub async fn slice_image_data_gpu(
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Result<js_sys::Array, JsValue> {
    let instance = wgpu::Instance::default();

    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            force_fallback_adapter: false,
            compatible_surface: None,
            ..Default::default()
        })
        .await
        .map_err(|e| {
            JsValue::from_str(&format!(
                "Failed to find a suitable WebGPU adapter: {:?}",
                e
            ))
        })?;

    let (device, queue) = adapter
        .request_device(&wgpu::DeviceDescriptor {
            label: Some("IMAGE_SLICER_DEVICE"),
            required_features: wgpu::Features::empty(),
            required_limits: wgpu::Limits::downlevel_defaults(),
            memory_hints: wgpu::MemoryHints::Performance,
            ..Default::default()
        })
        .await
        .map_err(|e| JsValue::from_str(&format!("Failed to create WebGPU device: {:?}", e)))?;

    let buffers = create_buffers(&device, pixel_data, width, height);

    run_upscaler(&device, &queue, &buffers);

    let slices = read_slices(&device, &queue, &buffers).await?;

    return Ok(slices);
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
    let src_h = height as u32;
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
    ];
    let params_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("PARAMS_BUFFER"),
        contents: bytemuck::cast_slice(&slice_params),
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
    });

    let total_output_size = (3 * 640 * 640 * 3 * 4) as wgpu::BufferAddress;

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
    let upscaler = device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: Some("IMAGE_UPSCALER_SHADER"),
        source: wgpu::ShaderSource::Wgsl(include_str!("upscaler.wgsl").into()),
    });

    let bind_grp_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("BIND_GROUP_LAYOUT"),
        entries: &[
            //PARM_LIST
            wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Storage { read_only: true },
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            },
            //INPUT
            wgpu::BindGroupLayoutEntry {
                binding: 1,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Storage { read_only: true },
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            },
            //OUTPUT
            wgpu::BindGroupLayoutEntry {
                binding: 2,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Storage { read_only: false },
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            },
        ],
    });

    let bind_grp = device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: Some("BIND_GROUP"),
        layout: &bind_grp_layout,
        entries: &[
            //PARM_LIST
            wgpu::BindGroupEntry {
                binding: 0,
                resource: buffers.params_buffer.as_entire_binding(),
            },
            //INPUT
            wgpu::BindGroupEntry {
                binding: 1,
                resource: buffers.input_buffer.as_entire_binding(),
            },
            //OUTPUT
            wgpu::BindGroupEntry {
                binding: 2,
                resource: buffers.output_buffer.as_entire_binding(),
            },
        ],
    });

    let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
        label: Some("PIPELINE_LAYOUT"),
        bind_group_layouts: &[Some(&bind_grp_layout)],
        immediate_size: 0,
    });

    let compute_pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
        label: Some("PIPELINE_COMPUTE"),
        layout: Some(&pipeline_layout),
        module: &upscaler,
        entry_point: Some("main"),
        compilation_options: Default::default(),
        cache: None,
    });

    let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
        label: Some("UPSCALER_ENCODER"),
    });

    {
        let mut compute_pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
            label: Some("COMPUTE PASS"),
            timestamp_writes: None,
        });

        compute_pass.set_pipeline(&compute_pipeline);
        compute_pass.set_bind_group(0, &bind_grp, &[]);
        // 640/16 = 40 workgroups in xy, 3 slices in z
        compute_pass.dispatch_workgroups(40, 50, 3);
    }
    queue.submit(Some(encoder.finish()));
}

// needed to read the output to staging
pub async fn read_slices(
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    buffers: &Buffers,
) -> Result<js_sys::Array, JsValue> {
    let total_output_size = (3 * 640 * 640 * 3 * std::mem::size_of::<f32>()) as wgpu::BufferAddress;

    let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
        label: Some("STAGING_COPY_ENCODER"),
    });

    encoder.copy_buffer_to_buffer(
        &buffers.output_buffer,
        0,
        &buffers.staging_buffer,
        0,
        total_output_size,
    );

    queue.submit(Some(encoder.finish()));

    let buffer_slice = buffers.staging_buffer.slice(..);
    let (sender, receiver) = futures_channel::oneshot::channel();
    buffer_slice.map_async(wgpu::MapMode::Read, move |result| {
        let _ = sender.send(result);
    });

    receiver
        .await
        .map_err(|_| JsValue::from_str("Buffer map channel dropped unexpectedly"))?
        .map_err(|e| JsValue::from_str(&format!("GPU buffer mapping failed: {:?}", e)))?;
    let result_array = js_sys::Array::new();
    {
        let data = buffer_slice
            .get_mapped_range()
            .map_err(|e| JsValue::from_str(&format!("Failed to get mapped range: {:?}", e)))?;

        let float_slice: &[f32] = bytemuck::cast_slice(&data[..]);

        let slice_float_count = 3 * 640 * 640;

        for i in 0..3 {
            let start = i * slice_float_count;
            let end = start + slice_float_count;
            let slice_data = &float_slice[start..end];

            let js_float_array = js_sys::Float32Array::from(slice_data);
            result_array.push(&js_float_array);
        }
    }
    buffers.staging_buffer.unmap();
    return Ok(result_array);
}
