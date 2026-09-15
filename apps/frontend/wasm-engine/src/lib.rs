use image::{ImageBuffer, Rgba, imageops::FilterType};
use js_sys::Float32Array;
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
        image::imageops::resize(&img, target_width, target_height, FilterType::Lanczos3);

    let resized_pixels = resized_img.into_raw();
    let resized_width = target_width as usize;
    let slice_size = 640;

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
    let mut slice = vec![0.0f32; total_pix * 3];
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
    pub center_x: f32,
    pub center_y: f32,
    pub top_left_x: f32,
    pub top_left_y: f32,
    pub width: f32,
    pub height: f32,
    pub confidence: f32,
}
#[wasm_bindgen]
pub fn infer_detectionData() {
    // function to call with 4 slices of data from TS
}
pub fn map_to_global() {
    // will map a single array of People changing co-ords to be global instead of local
}

pub fn intersection_over_union() {
    // standard means of detecting if 2 bounding boxes are the same person
    // 0 -> 1, 0 means no intersection, 1 full intersection
    // Does this via maf
    // Takes 2 bounding boxes calculates overlapping region
    // take overlap percentage
    // put into range
}

pub fn non_maximum_sepression() {
    // standard means of weeding out redundant overlapping boxes
    // order list in decending order of confidence score
    // take a person and go down list comparing IOU against box.
    // If any box has higher iou than threshold discard-> same person
    // rather keep an parallel array of all discarded ones only
}

pub fn read_result(slice_data: &Float32Array) -> Result<Vec<DetectedPerson>, String> {
    let data = slice_data.to_vec();
    let mut people: Vec<DetectedPerson> = Vec::new();

    const NUM_ANCHORS: usize = 8400;
    const NUM_FEATURES: usize = 84;
    const CONFIDENCE_THRESHOLD: f32 = 0.25;

    if data.len() < NUM_ANCHORS * NUM_FEATURES {
        return Err("Invalid tensor data length".to_string());
    }

    for anchor_idx in 0..NUM_ANCHORS {
        let confidence = data[4 * NUM_ANCHORS + anchor_idx];
        if confidence >= CONFIDENCE_THRESHOLD {
            let center_x = data[0 * NUM_ANCHORS + anchor_idx];
            let center_y = data[1 * NUM_ANCHORS + anchor_idx];
            let width = data[2 * NUM_ANCHORS + anchor_idx];
            let height = data[3 * NUM_ANCHORS + anchor_idx];

            let top_left_x = center_x - width / 2.0;
            let top_left_y = center_y - height / 2.0;

            people.push(DetectedPerson {
                center_x,
                center_y,
                top_left_x,
                top_left_y,
                width,
                height,
                confidence,
            });
        }
    }

    return Ok(people);
}
