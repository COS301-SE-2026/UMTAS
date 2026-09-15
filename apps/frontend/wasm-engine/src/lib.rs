use fast_image_resize as fr;
use serde::Serialize;
use std::num::NonZeroU32;
use std::{usize, vec};
use wasm_bindgen::prelude::*;
pub struct SliceFormat {
    x: usize,
    y: usize,
    slice_height: usize,
    slice_width: usize,
}

pub fn resize_image(
    pixel_data: &[u8],
    src_width: usize,
    src_height: usize,
    dst_width: usize,
    dst_height: usize,
) -> Result<Vec<u8>, String> {
    let src_w =
        NonZeroU32::new(src_width as u32).ok_or_else(|| "Invalid source width".to_string())?;
    let src_h =
        NonZeroU32::new(src_height as u32).ok_or_else(|| "Invalid source height".to_string())?;
    let dst_w =
        NonZeroU32::new(dst_width as u32).ok_or_else(|| "Invalid destination width".to_string())?;
    let dst_h = NonZeroU32::new(dst_height as u32)
        .ok_or_else(|| "Invalid destination height".to_string())?;

    let src_image = fr::images::Image::from_vec_u8(
        src_w.get(),
        src_h.get(),
        pixel_data.to_vec(),
        fr::PixelType::U8x4,
    )
    .map_err(|e| e.to_string())?;

    let mut dst_image = fr::images::Image::new(dst_w.get(), dst_h.get(), src_image.pixel_type());

    let mut resizer = fr::Resizer::new();

    let mut options = fr::ResizeOptions::new();
    options.algorithm = fr::ResizeAlg::Convolution(fr::FilterType::Lanczos3);

    resizer
        .resize(&src_image, &mut dst_image, Some(&options))
        .map_err(|e| e.to_string())?;

    Ok(dst_image.into_vec())
}
#[wasm_bindgen]
pub fn slice_image_data(
    pixel_data: &[u8],
    width: usize,
    height: usize,
) -> Result<js_sys::Array, JsValue> {
    let result_arr = js_sys::Array::new();

    // full image
    let full_pixels =
        resize_image(pixel_data, width, height, 640, 640).map_err(|e| JsValue::from_str(&e))?;

    let full_format = SliceFormat {
        x: 0,
        y: 0,
        slice_height: 640,
        slice_width: 640,
    };
    result_arr.push(&extract_slice(full_format, &full_pixels, 640));

    // quads
    let target_width = 1280;
    let target_height = 1280;
    let resized_pixels = resize_image(pixel_data, width, height, target_width, target_height)
        .map_err(|e| JsValue::from_str(&e))?;

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

    result_arr.push(&extract_slice(top_left, &resized_pixels, target_width));
    result_arr.push(&extract_slice(top_right, &resized_pixels, target_width));
    result_arr.push(&extract_slice(bottom_left, &resized_pixels, target_width));
    result_arr.push(&extract_slice(bottom_right, &resized_pixels, target_width));

    Ok(result_arr)
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

#[derive(Serialize, Clone)]
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
pub fn infer_detection_data(
    quadrants: js_sys::Array,
    full_data: js_sys::Float32Array,
) -> Result<String, JsValue> {
    // function to call with 4 slices of data from TS
    let mut all_people: Vec<DetectedPerson> = Vec::new();

    let data = full_data.to_vec();

    let people = read_result(&data).map_err(|e| JsValue::from_str(&e))?;
    all_people.extend(people);

    for (quad_idx, item) in quadrants.iter().enumerate() {
        let float_arr = item.dyn_ref::<js_sys::Float32Array>().ok_or_else(|| {
            JsValue::from_str(&format!(
                "Element at index {} is not a Float32Array",
                quad_idx
            ))
        })?;

        let data = float_arr.to_vec();

        let people = read_result(&data).map_err(|e| JsValue::from_str(&e))?;
        let global_adjusted_person = map_to_global(people, quad_idx);
        all_people.extend(global_adjusted_person);
    }

    let res_people = non_maximum_sepression(all_people, 0.45);

    return serde_json::to_string(&res_people).map_err(|e| JsValue::from_str(&e.to_string()));
}
pub fn read_result(slice_data: &Vec<f32>) -> Result<Vec<DetectedPerson>, String> {
    let data = slice_data.to_vec();
    let mut people: Vec<DetectedPerson> = Vec::new();

    const NUM_ANCHORS: usize = 8400;
    const NUM_FEATURES: usize = 84;
    const CONFIDENCE_THRESHOLD: f32 = 0.50;

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
// original is 1280 by 1280 then in terms of 640 by 640
// Global is the original 640 x 640
pub fn map_to_global(mut people: Vec<DetectedPerson>, quad_idx: usize) -> Vec<DetectedPerson> {
    // will map a single array of People changing co-ords to be global instead of local

    let (offset_x, offset_y) = match quad_idx {
        0 => (0.0, 0.0),
        1 => (640.0, 0.0),
        2 => (0.0, 640.0),
        3 => (640.0, 640.0),
        _ => (0.0, 0.0),
    };

    for person in &mut people {
        // shift to upscaled image size
        person.center_x += offset_x;
        person.center_y += offset_y;
        person.top_left_x += offset_x;
        person.top_left_y += offset_y;

        scale_person(person);
    }

    return people;
}
pub fn scale_person(person: &mut DetectedPerson) -> &mut DetectedPerson {
    person.center_x *= 0.5;
    person.center_y *= 0.5;
    person.top_left_x *= 0.5;
    person.top_left_y *= 0.5;
    person.width *= 0.5;
    person.height *= 0.5;

    return person;
}

pub fn intersection_over_union(box1: &DetectedPerson, box2: &DetectedPerson) -> f32 {
    // standard means of detecting if 2 bounding boxes are the same person
    // 0 -> 1, 0 means no intersection, 1 full intersection
    // Does this via maf
    // Takes 2 bounding boxes calculates overlapping region
    // take overlap percentage
    // put into range

    let b1_min_x = box1.top_left_x;
    let b1_min_y = box1.top_left_y;
    let b1_max_x = box1.top_left_x + box1.width;
    let b1_max_y = box1.top_left_y + box1.height;

    let b2_min_x = box2.top_left_x;
    let b2_min_y = box2.top_left_y;
    let b2_max_x = box2.top_left_x + box2.width;
    let b2_max_y = box2.top_left_y + box2.height;

    let inter_x_min = b1_min_x.max(b2_min_x);
    let inter_y_min = b1_min_y.max(b2_min_y);
    let inter_x_max = b1_max_x.min(b2_max_x);
    let inter_y_max = b1_max_y.min(b2_max_y);

    let inter_width = (inter_x_max - inter_x_min).max(0.0);
    let inter_height = (inter_y_max - inter_y_min).max(0.0);
    let intersection_area = inter_width * inter_height;

    if intersection_area == 0.0 {
        return 0.0;
    }

    let b1_area = box1.width * box1.height;
    let b2_area = box2.width * box2.height;
    let union_area = b1_area + b2_area - intersection_area;

    if union_area == 0.0 {
        return 0.0;
    }

    return intersection_area / union_area;
}

pub fn is_enveloped(box1: &DetectedPerson, box2: &DetectedPerson) -> bool {
    let b1_min_x = box1.top_left_x;
    let b1_min_y = box1.top_left_y;
    let b1_max_x = box1.top_left_x + box1.width;
    let b1_max_y = box1.top_left_y + box1.height;

    let b2_min_x = box2.top_left_x;
    let b2_min_y = box2.top_left_y;
    let b2_max_x = box2.top_left_x + box2.width;
    let b2_max_y = box2.top_left_y + box2.height;

    let inter_x_min = b1_min_x.max(b2_min_x);
    let inter_y_min = b1_min_y.max(b2_min_y);
    let inter_x_max = b1_max_x.min(b2_max_x);
    let inter_y_max = b1_max_y.min(b2_max_y);

    let inter_width = (inter_x_max - inter_x_min).max(0.0);
    let inter_height = (inter_y_max - inter_y_min).max(0.0);
    let intersection_area = inter_width * inter_height;

    if intersection_area == 0.0 {
        return false;
    }

    let b1_area = box1.width * box1.height;
    let b2_area = box2.width * box2.height;
    let smaller_area = b1_area.min(b2_area);

    // If the intersection covers e.g. 80% or more of the smaller box, it's enveloped
    return (intersection_area / smaller_area) >= 0.80;
}

pub fn non_maximum_sepression(
    mut people: Vec<DetectedPerson>,
    iou_threshold: f32,
) -> Vec<DetectedPerson> {
    // standard means of weeding out redundant overlapping boxes
    // order list in decending order of confidence score
    // take a person and go down list comparing IOU against box.
    // If any box has higher iou than threshold discard-> same person
    // rather keep an parallel array of all discarded ones only

    let mut final_people: Vec<DetectedPerson> = Vec::new();
    // parallel array for whos been removed
    let mut removed_people: Vec<bool> = vec![false; people.len()];

    people.sort_by(|a, b| {
        b.confidence
            .partial_cmp(&a.confidence)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    for (idx, person) in people.iter().enumerate() {
        if removed_people[idx] == false {
            final_people.push(person.clone());
            for compare_index in idx..people.len() {
                let iou = intersection_over_union(person, &people[compare_index]);
                if iou >= iou_threshold {
                    removed_people[compare_index] = true;
                }
                let is_within = is_enveloped(person, &people[compare_index]);
                {
                    if is_within {
                        removed_people[compare_index] = true;
                    }
                }
            }
        }
    }

    return final_people;
}
