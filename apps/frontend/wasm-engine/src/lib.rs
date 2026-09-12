use std::usize;

use js_sys::JsString;
use wasm_bindgen::prelude::*;

pub struct SliceFormat {
    x: usize,
    y: usize,
    slice_height: usize,
    slice_width: usize,
}

#[wasm_bindgen]
pub fn slice_image_data(pixel_data: &[u8], width: usize, height: usize) -> js_sys::Array {
    let center_x = width / 2;
    let center_y = height / 2;

    // can be made to overlap but right now no
    let slice_height = center_y;
    let slice_width = center_x;

    // the slices
    let top_left = SliceFormat {
        x: 0,
        y: 0,
        slice_height: slice_height,
        slice_width: slice_width,
    };
    let top_right = SliceFormat {
        x: center_x,
        y: 0,
        slice_height: slice_height,
        slice_width: slice_width,
    };
    let bottom_left = SliceFormat {
        x: 0,
        y: center_y,
        slice_height: slice_height,
        slice_width: slice_width,
    };
    let bottom_right = SliceFormat {
        x: center_x,
        y: center_y,
        slice_height: slice_height,
        slice_width: slice_width,
    };

    let result_arr = js_sys::Array::new();

    result_arr.push(&extract_slice(top_left, pixel_data, width));

    result_arr.push(&extract_slice(top_right, pixel_data, width));
    result_arr.push(&extract_slice(bottom_left, pixel_data, width));
    result_arr.push(&extract_slice(bottom_right, pixel_data, width));

    return result_arr;
}
// all slices must be broken into [all reds][all greens][all blues] for BCHW
pub fn extract_slice(
    start_pix: SliceFormat,
    pixel_data: &[u8],
    full_width: usize,
) -> js_sys::Float32Array {
    let total_pix = start_pix.slice_width * start_pix.slice_height * 3;

    let mut slice = vec![0.0; total_pix];

    // one for loop to creage all 3 buffers of slice
    let mut r_offset = 0;
    let mut g_offset = total_pix;
    let mut b_offset = total_pix + 2;

    for row in 0..start_pix.slice_height {
        let global_y = start_pix.y + row;

        for col in 0..start_pix.slice_width {
            let global_x = start_pix.x + col;
            let src_idx = (global_y * full_width + global_x) * 4; // puts 2d into 1d

            slice[r_offset] = normalize_pixel(&pixel_data[src_idx]);
            slice[g_offset] = normalize_pixel(&pixel_data[src_idx + 1]);
            slice[b_offset] = normalize_pixel(&pixel_data[src_idx + 2]);

            r_offset += 1;
            g_offset += 1;
            b_offset += 1;
        }
    }

    return js_sys::Float32Array::from(&slice[..]);
}

pub fn normalize_pixel(colour: &u8) -> f32 {
    return (*colour as f32) / 255.0;
}
