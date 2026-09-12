use std::fmt::Alignment::{Center, Right};

use wasm_bindgen::prelude::*;

struct SliceFormat {
    x: usize,
    y: usize,
}

#[wasm_bindgen]
pub fn slice_image_data(pixel_data: &[u8], width: usize, height: usize) -> js_sys::Array {
    let center_x = width / 2;
    let center_y = height / 2;

    let result = js_sys::Array::new();
    // the slices
    let top_left = SliceFormat { x: 0, y: 0 };
    let top_right = SliceFormat { x: center_x, y: 0 };
    let bottom_left = SliceFormat { x: 0, y: center_y };
    let bottom_right = SliceFormat {
        x: center_x,
        y: center_y,
    };

    return result;
}
