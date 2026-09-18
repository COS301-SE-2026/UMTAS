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

fn fetch_px(x:u32,y:u32,src_width:u32,src_height:u32)->vec3<f32>{

    let clamped_x = min(x,src_width -1u);
    let clamped_y = min(y,src_height -1u);


    let index = clamped_y * src_width + clamped_x;
    let packed_px = input_bytes[index];

    // needs bit shifts since we packed the bits together for memory
    // sounded nice in theory may be more effort than due
    let r  = f32(packed_px & 0xFFu);
    let g  = f32((packed_px >> 8u) & 0xFFu) ;
    let b  = f32((packed_px >> 16u) & 0xFFu) ;

    return vec3<f32>(r,g,b) * (1.0 / 255.0);
}


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
    let p00 = fetch_px(x0, y0, params.src_width, params.src_height); // TL
    let p10 = fetch_px(x1, y0, params.src_width, params.src_height); // TR
    let p01 = fetch_px(x0, y1, params.src_width, params.src_height); // BL
    let p11 = fetch_px(x1, y1, params.src_width, params.src_height); // BR

    // bi lin weights
    let fx = fract(max(src_x_f, 0.0));
    let fy = fract(max(src_y_f, 0.0));

    // mixing the weights
    let top = mix(p00, p10, fx);
    let bottom = mix(p01, p11, fx);
    let final_rgb = mix(top, bottom, fy);


    // exporting to buffer
    let spatial_area = 640u * 640u;
    let plane_size = spatial_area;
    let slice_offset = slice_index * 3u * plane_size; 
    let pixel_idx = out_y * 640u + out_x;
    // indexes
    let r_dst = slice_offset + (0u * plane_size) + pixel_idx;
    let g_dst = slice_offset + (1u * plane_size) + pixel_idx;
    let b_dst = slice_offset + (2u * plane_size) + pixel_idx;

    output_floats[r_dst] = final_rgb.r;
    output_floats[g_dst] = final_rgb.g;
    output_floats[b_dst] = final_rgb.b;
}
