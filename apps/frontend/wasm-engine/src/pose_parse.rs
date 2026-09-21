use std::string;

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
) -> Result<String, JsValue> {
    let people: Vec<DetectedPersonPose> = serde_wasm_bindgen::from_value(people_val)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse people array: {}", e)))?;

    let prev_frame: FrameStore = serde_wasm_bindgen::from_value(prev_frame)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse prev_frame array: {}", e)))?;

    let frame: FrameStore = attach_id(frame, timestamp, people, prev_frame);

    return serde_json::to_string(&frame).map_err(|e| JsValue::from_str(&e.to_string()));
}

// if new_frame_people size < prev frame => prev frame adds people
// if new frame size > prev frame => new people added along with recounted / existing
pub fn attach_id(
    frame: u32,
    timestamp: f64,
    new_frame_people: Vec<DetectedPersonPose>,
    prev_frame: FrameStore,
) -> FrameStore {
    let mut new_people: Vec<SinglePersonSessionData> = [].to_vec();
    const IOU_THRESHOLD: f32 = 0.35;
    // check array
    let mut matched_prev_indices = vec![false; prev_frame.people.len()];
    let mut matched_new_indices = vec![false; new_frame_people.len()];

    let mut highest_id = prev_frame
        .people
        .iter()
        .map(|p| p.assigned_id)
        .max()
        .unwrap_or(0);

    // finding matches
    for (new_index, new_person) in new_frame_people.iter().enumerate() {
        for (prev_index, prev_person) in prev_frame.people.iter().enumerate() {
            if matched_prev_indices[prev_index] == false
                && matching_person(new_person, &prev_person.pose_data, IOU_THRESHOLD)
            {
                matched_prev_indices[prev_index] = true;
                matched_new_indices[new_index] = true;
                new_people.push(SinglePersonSessionData {
                    pose_data: new_person.clone(),
                    assigned_id: prev_person.assigned_id,
                    is_inferred: false,
                    last_seen_frame: frame,
                    last_seen_timestamp: timestamp,
                    hand_up: is_hands_up(new_person),
                });
            }
        }
    }
    for (prev_index, prev_person) in prev_frame.people.iter().enumerate() {
        if matched_prev_indices[prev_index] == false {
            matched_prev_indices[prev_index] = true;

            new_people.push(SinglePersonSessionData {
                pose_data: prev_person.pose_data.clone(),
                assigned_id: prev_person.assigned_id,
                is_inferred: true,
                last_seen_frame: prev_frame.frame_number,
                last_seen_timestamp: prev_frame.timestamp,
                hand_up: false,
                // we do not look at hands up of inferred frames
            });
        }
    }

    // not previosuly detected
    for (new_index, new_person) in new_frame_people.iter().enumerate() {
        if matched_new_indices[new_index] == false {
            let this_id = highest_id + 1;
            highest_id += 1;
            matched_new_indices[new_index] = true;
            new_people.push(SinglePersonSessionData {
                pose_data: new_person.clone(),
                assigned_id: this_id,
                is_inferred: false,
                last_seen_frame: frame,
                last_seen_timestamp: timestamp,
                hand_up: is_hands_up(new_person),
            });
        }
    }

    return FrameStore {
        frame_number: frame,
        timestamp: timestamp,
        people: new_people,
    };
}
pub fn is_hands_up(new_person: &DetectedPersonPose) -> bool {
    return new_person.right_arm[1].y < new_person.nose.y
        || new_person.left_arm[1].y < new_person.nose.y;
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
