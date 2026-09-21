use crate::pose_inference::{DetectedPersonPose, Keypoint};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// this must ensure that the first frame is handled in different step
use crate::intersection_over_union;

#[wasm_bindgen]
pub fn analyze_frame(
    frame: u32,
    timestamp: f64,
    prev_frame: JsValue,
    people_val: JsValue,
) -> Result<(), JsValue> {
    let people: Vec<DetectedPersonPose> = serde_wasm_bindgen::from_value(people_val)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse people array: {}", e)))?;

    let prev_frame: FrameStore = serde_wasm_bindgen::from_value(prev_frame)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse prev_frame array: {}", e)))?;

    Ok(())
}

// if new_frame_people size < prev frame => prev frame adds people
// if new frame size > prev frame => new people added along with recounted / existing
pub fn attach_id(new_frame_people: Vec<DetectedPersonPose>, prev_frame: FrameStore) -> FrameStore {
    let new_people: Vec<SinglePersonSessionData>;
    const IOU_THRESHOLD: f32 = 0.35;
    // check array
    let mut matched_prev_indices = vec![false; prev_frame.people.len()];

    for new_person in &new_frame_people {
        for prev_person in &prev_frame.people {
            if matching_person(new_person, &prev_person.pose_data, IOU_THRESHOLD) {
                // are matching
            } else {
                // not matching
            }
        }
    }

    return FrameStore {
        frame_number: 0,
        timestamp: 0.0,
        people: [].to_vec(),
    };
}
pub fn matching_person(
    new_person: &DetectedPersonPose,
    prev_person: &DetectedPersonPose,
    iou_thresh: f32,
) -> bool {
    return intersection_over_union(&new_person.person, &prev_person.person) > iou_thresh;
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SinglePersonSessionData {
    pub pose_data: DetectedPersonPose,
    pub assigned_id: u32,
    pub is_inferred: bool,
    pub last_seen_frame: u32,
    pub last_seen_timestamp: f64,
    pub hand_up: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FrameStore {
    pub frame_number: u32,
    pub timestamp: f64,
    pub people: Vec<SinglePersonSessionData>,
}
