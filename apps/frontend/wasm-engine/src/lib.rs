use std::fmt::Alignment::{Center, Right};

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
    let slice_height = center_x;
    let slice_width = center_y;

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

struct extract_slice_struct<'a> {
    start: SliceFormat,
    pixel_data: &'a [u8], // lifetime scary
}
