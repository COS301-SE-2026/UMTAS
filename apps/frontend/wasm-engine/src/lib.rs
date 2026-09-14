use image::{ImageBuffer, Rgba, imageops::FilterType};
use std::usize;
use wasm_bindgen::prelude::*;
pub struct SliceFormat {
    x: usize,
    y: usize,
    slice_height: usize,
    slice_width: usize,
}

#[wasm_bindgen]
pub fn slice_image_data(
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Result<js_sys::Array, JsValue> {
    let img =
        ImageBuffer::<Rgba<u8>, _>::from_raw(width as u32, height as u32, pixel_data.to_vec())
            .ok_or_else(|| JsValue::from_str("Invalid pixel data dimensions"))?;

    let target_width = 1280;
    let target_height = 1280;

    let resized_img =
        image::imageops::resize(&img, target_width, target_height, FilterType::Nearest);

    let resized_pixels = resized_img.into_raw();
    let resized_width = target_width as usize;
    let slice_size = 640;

    // the slices
    let top_left = SliceFormat {
        x: 0,
        y: 0,
        slice_height: slice_size,
        slice_width: slice_size,
    };
    let top_right = SliceFormat {
        x: slice_size,
        y: 0,
        slice_height: slice_size,
        slice_width: slice_size,
    };
    let bottom_left = SliceFormat {
        x: 0,
        y: slice_size,
        slice_height: slice_size,
        slice_width: slice_size,
    };
    let bottom_right = SliceFormat {
        x: slice_size,
        y: slice_size,
        slice_height: slice_size,
        slice_width: slice_size,
    };

    let result_arr = js_sys::Array::new();

    result_arr.push(&extract_slice(top_left, &resized_pixels, resized_width));
    result_arr.push(&extract_slice(top_right, &resized_pixels, resized_width));
    result_arr.push(&extract_slice(bottom_left, &resized_pixels, resized_width));
    result_arr.push(&extract_slice(bottom_right, &resized_pixels, resized_width));

    return Ok(result_arr);
}
// all slices must be broken into [all reds][all greens][all blues] for BCHW
pub fn extract_slice(
    start_pix: SliceFormat,
    pixel_data: &[u8],
    full_width: usize,
) -> js_sys::Float32Array {
    let total_pix = start_pix.slice_width * start_pix.slice_height;

    let mut slice = vec![0.0; total_pix * 3];

    // one for loop to creage all 3 buffers of slice
    let mut r_offset = 0;
    let mut g_offset = total_pix;
    let mut b_offset = total_pix * 2;

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

pub struct DetectedPerson {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub confidence: f32,
}
