use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::DetectedPerson;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Keypoint {
    pub x: f32,
    pub y: f32,
    pub score: f32,
}

#[derive(Serialize, Clone)]
pub struct DetectedPersonPose {
    pub person: DetectedPerson,
    pub keypoints: Vec<Keypoint>,
}

#[wasm_bindgen]
pub fn infer_detection_data(
    quadrants: js_sys::Array,
    full_data: js_sys::Float32Array,
) -> Result<String, JsValue> {
    // function to call with 4 slices of data from TS
    let mut all_people: Vec<DetectedPersonPose> = Vec::new();

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

    let res_people = non_maximum_sepression(all_people, 0.50);

    return serde_json::to_string(&res_people).map_err(|e| JsValue::from_str(&e.to_string()));
}

pub fn read_result(slice_data: &[f32]) -> Result<Vec<DetectedPersonPose>, String> {
    let mut people: Vec<DetectedPersonPose> = Vec::new();

    const NUM_ANCHORS: usize = 8400;
    // pre calced
    const NUM_FEATURES: usize = 61;
    const NUM_KEYPOINTS: usize = 17;
    const CONFIDENCE_THRESHOLD: f32 = 0.15;

    if slice_data.len() < NUM_ANCHORS * NUM_FEATURES {
        return Err("Invalid tensor data length".to_string());
    }

    for anchor_idx in 0..NUM_ANCHORS {
        let confidence = slice_data[4 * NUM_ANCHORS + anchor_idx];

        if confidence >= CONFIDENCE_THRESHOLD {
            let center_x = slice_data[0 * NUM_ANCHORS + anchor_idx];
            let center_y = slice_data[1 * NUM_ANCHORS + anchor_idx];
            let width = slice_data[2 * NUM_ANCHORS + anchor_idx];
            let height = slice_data[3 * NUM_ANCHORS + anchor_idx];

            let top_left_x = center_x - width / 2.0;
            let top_left_y = center_y - height / 2.0;

            //  17 keypoints starting at 5
            let mut keypoints = Vec::with_capacity(NUM_KEYPOINTS);
            for kp_idx in 0..NUM_KEYPOINTS {
                let kp_offset = 5 + (kp_idx * 3);
                let x = slice_data[kp_offset * NUM_ANCHORS + anchor_idx];
                let y = slice_data[(kp_offset + 1) * NUM_ANCHORS + anchor_idx];
                let score = slice_data[(kp_offset + 2) * NUM_ANCHORS + anchor_idx];

                keypoints.push(Keypoint { x, y, score });
            }

            people.push(DetectedPersonPose {
                person: DetectedPerson {
                    center_x,
                    center_y,
                    top_left_x,
                    top_left_y,
                    width,
                    height,
                    confidence,
                },
                keypoints,
            });
        }
    }

    return Ok(people);
}
