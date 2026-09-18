use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::{DetectedPerson, intersection_over_union, is_enveloped};

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
pub fn infer_pose_data(
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

    const NUM_FEATURES: usize = 56;
    const NUM_KEYPOINTS: usize = 17;
    const CONFIDENCE_THRESHOLD: f32 = 0.15;

    if slice_data.is_empty() || slice_data.len() % NUM_FEATURES != 0 {
        return Err(format!(
            "Invalid tensor data length: {}. Expected a multiple of {}",
            slice_data.len(),
            NUM_FEATURES
        ));
    }

    let num_anchors = slice_data.len() / NUM_FEATURES;

    for anchor_idx in 0..num_anchors {
        let confidence = slice_data[4 * num_anchors + anchor_idx];

        if confidence >= CONFIDENCE_THRESHOLD {
            let center_x = slice_data[0 * num_anchors + anchor_idx];
            let center_y = slice_data[1 * num_anchors + anchor_idx];
            let width = slice_data[2 * num_anchors + anchor_idx];
            let height = slice_data[3 * num_anchors + anchor_idx];

            let top_left_x = center_x - width / 2.0;
            let top_left_y = center_y - height / 2.0;

            let mut keypoints = Vec::with_capacity(NUM_KEYPOINTS);
            for kp_idx in 0..NUM_KEYPOINTS {
                let kp_offset = 5 + (kp_idx * 3);
                let x = slice_data[kp_offset * num_anchors + anchor_idx];
                let y = slice_data[(kp_offset + 1) * num_anchors + anchor_idx];
                let score = slice_data[(kp_offset + 2) * num_anchors + anchor_idx];

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

pub fn map_to_global(
    mut people: Vec<DetectedPersonPose>,
    quad_idx: usize,
) -> Vec<DetectedPersonPose> {
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
        person.person.center_x += offset_x;
        person.person.center_y += offset_y;
        person.person.top_left_x += offset_x;
        person.person.top_left_y += offset_y;

        scale_person(&mut person.person);

        for kp in &mut person.keypoints {
            kp.x += offset_x;
            kp.x *= 0.5;
            kp.y += offset_y;
            kp.y *= 0.5;
        }
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

pub fn non_maximum_sepression(
    mut people: Vec<DetectedPersonPose>,
    iou_threshold: f32,
) -> Vec<DetectedPersonPose> {
    // standard means of weeding out redundant overlapping boxes
    // order list in decending order of confidence score
    // take a person and go down list comparing IOU against box.
    // If any box has higher iou than threshold discard-> same person
    // rather keep an parallel array of all discarded ones only

    let mut final_people: Vec<DetectedPersonPose> = Vec::new();
    // parallel array for whos been removed
    let mut removed_people: Vec<bool> = vec![false; people.len()];

    people.sort_by(|a, b| {
        b.person
            .confidence
            .partial_cmp(&a.person.confidence)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    for (idx, person) in people.iter().enumerate() {
        if removed_people[idx] == false {
            final_people.push(person.clone());
            for compare_index in idx..people.len() {
                let iou = intersection_over_union(&person.person, &people[compare_index].person);
                if iou >= iou_threshold {
                    removed_people[compare_index] = true;
                }
                let is_within = is_enveloped(&person.person, &people[compare_index].person);

                if is_within {
                    removed_people[compare_index] = true;
                }
            }
        }
    }

    return final_people;
}
