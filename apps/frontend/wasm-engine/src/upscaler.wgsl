struct slice_param {
    src_width: u32,
    src_height: u32,
    crop_x: u32,
    crop_y: u32,
    scale_x: f32,
    scale_y: f32,
    slice_index: u32,
    _pad: u32,
};
// tha buffers i made
@group(0) @binding(0) var<storage, read> params_list: array<slice_param, 5>;
@group(0) @binding(1) var<storage, read> input_bytes: array<u32>;
@group(0) @binding(2) var<storage, read_write> output_floats: array<f32>;

// 256 threads
@compute @workgroup_size(16, 16, 1)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
    // upscale here
}
