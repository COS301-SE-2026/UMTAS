use std::usize;

use wasm_bindgen::prelude::*;

struct SliceFormat {
    x: usize,
    y: usize,
    slice_height: usize,
    slice_width: usize,
}

#[wasm_bindgen]
pub fn slice_image_data(pixel_data: &[u8], width: usize, height: usize) -> js_sys::Array {
    let center_x = width / 2;
    let center_y = height / 2;

    let result = js_sys::Array::new();
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

    return result;
}
// all slices must be broken into [all reds][all greens][all blues] for BCHW
pub fn extract_slice(start_pix: SliceFormat, pixel_data: &[u8], fullWidth: usize) {
    let total_pix = start_pix.slice_width * start_pix.slice_height * 3;

    let mut slice = vec![0.0; total_pix];

    let r_offset = 0;
    
}

pub fn normalize_pixel(colour: &u8) -> f32 {
    return (*colour as f32) / 255.0;
}
