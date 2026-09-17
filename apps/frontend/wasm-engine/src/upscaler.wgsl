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
    let out_x = global_id.x;
    let out_y = global_id.y;
    let slice_index = workgroup_id.z;

    if (out_x >= 640 || out_y >=640){
    return;
    }

    let params = params_list[slice_index];

    // map to 2x2 grid 
    let  src_x_f = (f32(out_x) + f32(params.crop_x)) / params.scale_x;
    let  src_y_f = (f32(out_y) + f32(params.crop_y)) / params.scale_y;


    // set top left pixel of slice 
    // keep indices between 0 and 1280
    let x0 = clamp(u32(floor(max(src_x_f))), 0u, params.src_width -1u);
    let y0 = clamp(u32(floor(max(src_y_f))), 0u, params.src_height -1u);

    // set bottom right pxl 
    let x1 = min(x0 + 1u, params.src_width - 1u);
    let y1 = min(y0 + 1u, params.src_height - 1u);

    // read px

}
