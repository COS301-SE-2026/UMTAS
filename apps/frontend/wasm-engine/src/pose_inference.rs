use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::{DetectedPerson, intersection_over_union, is_enveloped};

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Keypoint {
    pub x: f32,
    pub y: f32,
    pub score: f32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DetectedPersonPose {
    pub person: DetectedPerson,
    pub nose: Keypoint,
    pub center_mass: Keypoint,
    pub left_shoulder: Keypoint,
    pub left_arm: Vec<Keypoint>, // 2 points
    pub right_shoulder: Keypoint,
    pub right_arm: Vec<Keypoint>, // 2 points
}

#[wasm_bindgen]
pub fn infer_pose_data(
    quadrants: js_sys::Array,
    full_data: js_sys::Float32Array,
) -> Result<String, JsValue> {
    let mut all_people: Vec<DetectedPersonPose> = Vec::new();

    let data = full_data.to_vec();

    let mut full_image_people = read_result(&data).map_err(|e| JsValue::from_str(&e))?;

    full_image_people.sort_by(|a, b| {
        b.person
            .confidence
            .partial_cmp(&a.person.confidence)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let mut quadrant_people: Vec<DetectedPersonPose> = Vec::new();

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
        quadrant_people.extend(global_adjusted_person);
    }

    quadrant_people.sort_by(|a, b| {
        b.person
            .confidence
            .partial_cmp(&a.person.confidence)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    all_people.extend(full_image_people);
    all_people.extend(quadrant_people);

    let res_people = non_maximum_sepression(all_people, 0.30);

    return serde_json::to_string(&res_people).map_err(|e| JsValue::from_str(&e.to_string()));
}

fn get_kp(slice_data: &[f32], coco_idx: usize, anchor_idx: usize, num_anchors: usize) -> Keypoint {
    let kp_offset = 5 + (coco_idx * 3);
    let x = slice_data[kp_offset * num_anchors + anchor_idx];
    let y = slice_data[(kp_offset + 1) * num_anchors + anchor_idx];
    let score = slice_data[(kp_offset + 2) * num_anchors + anchor_idx];
    Keypoint { x, y, score }
}

pub fn read_result(slice_data: &[f32]) -> Result<Vec<DetectedPersonPose>, String> {
    let mut people: Vec<DetectedPersonPose> = Vec::new();

    const NUM_FEATURES: usize = 56;
    const CONFIDENCE_THRESHOLD: f32 = 0.15;
    const KEYPOINT_CONFIDENCE_THRESHOLD: f32 = 0.1;

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

            let nose = get_kp(slice_data, 0, anchor_idx, num_anchors);
            let left_shoulder = get_kp(slice_data, 5, anchor_idx, num_anchors);
            let right_shoulder = get_kp(slice_data, 6, anchor_idx, num_anchors);

            if nose.score < KEYPOINT_CONFIDENCE_THRESHOLD
                || left_shoulder.score < KEYPOINT_CONFIDENCE_THRESHOLD
                || right_shoulder.score < KEYPOINT_CONFIDENCE_THRESHOLD
            {
                continue;
            }

            let left_elbow = get_kp(slice_data, 7, anchor_idx, num_anchors);
            let right_elbow = get_kp(slice_data, 8, anchor_idx, num_anchors);
            let left_wrist = get_kp(slice_data, 9, anchor_idx, num_anchors);
            let right_wrist = get_kp(slice_data, 10, anchor_idx, num_anchors);

            let shoulder_midpoint = Keypoint {
                x: (left_shoulder.x + right_shoulder.x) / 2.0,
                y: (left_shoulder.y + right_shoulder.y) / 2.0,
                score: (left_shoulder.score + right_shoulder.score) / 2.0,
            };

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
                left_shoulder,
                right_shoulder,
                left_arm: vec![left_elbow, left_wrist],
                right_arm: vec![right_elbow, right_wrist],
                center_mass: shoulder_midpoint,
                nose,
            });
        }
    }

    return Ok(people);
}

pub fn map_to_global(
    mut people: Vec<DetectedPersonPose>,
    quad_idx: usize,
) -> Vec<DetectedPersonPose> {
    let (offset_x, offset_y) = match quad_idx {
        0 => (0.0, 0.0),
        1 => (640.0, 0.0),
        _ => (0.0, 0.0),
    };

    for person in &mut people {
        person.person.center_x += offset_x;
        person.person.center_y += offset_y;
        person.person.top_left_x += offset_x;
        person.person.top_left_y += offset_y;

        scale_person(&mut person.person);

        transform_keypoint(&mut person.nose, offset_x, offset_y);
        transform_keypoint(&mut person.center_mass, offset_x, offset_y);
        transform_keypoint(&mut person.left_shoulder, offset_x, offset_y);
        transform_keypoint(&mut person.right_shoulder, offset_x, offset_y);

        for kp in &mut person.left_arm {
            transform_keypoint(kp, offset_x, offset_y);
        }
        for kp in &mut person.right_arm {
            transform_keypoint(kp, offset_x, offset_y);
        }
    }

    return people;
}

fn transform_keypoint(kp: &mut Keypoint, offset_x: f32, offset_y: f32) {
    kp.x = (kp.x + offset_x) * 0.5;
    kp.y = (kp.y + offset_y) * 0.5;
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
    people: Vec<DetectedPersonPose>,
    iou_threshold: f32,
) -> Vec<DetectedPersonPose> {
    let mut final_people: Vec<DetectedPersonPose> = Vec::new();
    let mut removed_people: Vec<bool> = vec![false; people.len()];

    for (idx, person) in people.iter().enumerate() {
        if removed_people[idx] == false {
            final_people.push(person.clone());
            for compare_index in (idx + 1)..people.len() {
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
