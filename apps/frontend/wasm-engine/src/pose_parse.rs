use crate::pose_inference::DetectedPersonPose;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// this must ensure that the first frame is handled in different step

use crate::intersection_over_union;

#[wasm_bindgen]
pub fn first_frame(frame: usize, timestamp: f64, people_val: JsValue) -> Result<String, JsValue> {
    let people: Vec<DetectedPersonPose> = serde_wasm_bindgen::from_value(people_val)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse people array: {}", e)))?;

    let frame_store: FrameStore = attach_id_first(frame, timestamp, people);

    return serde_json::to_string(&frame_store).map_err(|e| JsValue::from_str(&e.to_string()));
}

pub fn attach_id_first(
    frame: usize,
    timestamp: f64,
    new_frame_people: Vec<DetectedPersonPose>,
) -> FrameStore {
    let mut new_people: Vec<SinglePersonSessionData> = [].to_vec();

    let mut highest_id = 0;

    // not previosuly detected
    for new_person in new_frame_people {
        let this_id = highest_id + 1;
        highest_id += 1;
        new_people.push(SinglePersonSessionData {
            pose_data: new_person.clone(),
            assigned_id: this_id,
            is_inferred: false,
            last_seen_frame: frame,
            last_seen_timestamp: timestamp,
            hand_up: is_hands_up(&new_person),
            gaze: analyze_gaze(&new_person),
        });
    }

    return FrameStore {
        frame_number: frame,
        timestamp: timestamp,
        people: new_people,
    };
}

#[wasm_bindgen]
pub fn analyze_frame(
    frame: usize,
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
    frame: usize,
    timestamp: f64,
    new_frame_people: Vec<DetectedPersonPose>,
    prev_frame: FrameStore,
) -> FrameStore {
    let mut new_people: Vec<SinglePersonSessionData> = [].to_vec();
    const IOU_THRESHOLD: f32 = 0.1;
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
        let mut best_iou: f32 = IOU_THRESHOLD;
        let mut best_index_prev_idx: Option<usize> = None;
        for (prev_index, prev_person) in prev_frame.people.iter().enumerate() {
            if matched_prev_indices[prev_index] {
                continue;
            }

            let iou = intersection_over_union(&new_person.person, &prev_person.pose_data.person);
            if best_iou < iou {
                best_index_prev_idx = Some(prev_index);
                best_iou = iou;
            }
        }

        if let Some(prev_idx) = best_index_prev_idx {
            if best_iou >= IOU_THRESHOLD
                && matched_new_indices[new_index] == false
                && matched_prev_indices[prev_idx] == false
            {
                matched_new_indices[new_index] = true;
                matched_prev_indices[prev_idx] = true;

                new_people.push(SinglePersonSessionData {
                    pose_data: new_person.clone(),
                    assigned_id: prev_frame.people[prev_idx].assigned_id,
                    is_inferred: false,
                    last_seen_frame: frame,
                    last_seen_timestamp: timestamp,
                    hand_up: is_hands_up(new_person),
                    gaze: analyze_gaze(new_person),
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
                last_seen_frame: prev_person.last_seen_frame,
                last_seen_timestamp: prev_person.last_seen_timestamp,
                hand_up: false,
                gaze: GazeDirection {
                    looking_left: false,
                    looking_right: false,
                    looking_straight: false,
                },
                // we do not look at hands up or gaze of inferred frames
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
                gaze: analyze_gaze(new_person),
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
    let bottom_boundary = (new_person.center_mass.y + new_person.nose.y) / 2.0;

    let right_hand_up =
        new_person.right_arm.len() > 1 && new_person.right_arm[1].y <= bottom_boundary;

    let left_hand_up = new_person.left_arm.len() > 1 && new_person.left_arm[1].y <= bottom_boundary;

    right_hand_up || left_hand_up
}

pub fn analyze_gaze(person: &DetectedPersonPose) -> GazeDirection {
    const CONF_THRESHOLD: f32 = 0.1;
    const EAR_MOTIVATION: f32 = 0.2;

    let has_left_eye = person.left_eye.score > CONF_THRESHOLD;
    let has_right_eye = person.right_eye.score > CONF_THRESHOLD;
    let has_nose = person.nose.score > CONF_THRESHOLD;

    let has_left_ear = person.left_ear.score > CONF_THRESHOLD;
    let has_right_ear = person.right_ear.score > CONF_THRESHOLD;

    let mut score_left: f32 = 0.0;
    let mut score_right: f32 = 0.0;
    let mut score_forward: f32 = 1.0;

    if has_nose && has_left_eye && has_right_eye {
        let right_eye_x = person.right_eye.x;
        let left_eye_x = person.left_eye.x;
        let nose_x = person.nose.x;

        let eye_span = left_eye_x - right_eye_x;
        if eye_span > 1.0 {
            let nose_ratio = (nose_x - right_eye_x) / eye_span;
            let deviation = nose_ratio - 0.5;

            if deviation < -0.15 {
                score_left += deviation.abs() * 2.0;
                score_forward -= deviation.abs();
            } else if deviation > 0.15 {
                score_right += deviation.abs() * 2.0;
                score_forward -= deviation.abs();
            } else {
                score_forward += 0.5;
            }
        }
    }

    if has_left_ear && !has_right_ear {
        score_right += EAR_MOTIVATION;
    } else if has_right_ear && !has_left_ear {
        score_left += EAR_MOTIVATION;
    }

    score_left = score_left.max(0.0);
    score_right = score_right.max(0.0);
    score_forward = score_forward.max(0.0);

    let looking_left = score_left > score_right && score_left > score_forward;
    let looking_right = score_right > score_left && score_right > score_forward;
    let looking_straight = !looking_left && !looking_right;

    return GazeDirection {
        looking_left,
        looking_right,
        looking_straight,
    };
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GazeDirection {
    pub looking_left: bool,
    pub looking_right: bool,
    pub looking_straight: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SinglePersonSessionData {
    pub pose_data: DetectedPersonPose,
    pub assigned_id: usize,
    pub is_inferred: bool,
    pub last_seen_frame: usize,
    pub last_seen_timestamp: f64,
    pub hand_up: bool,
    pub gaze: GazeDirection,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FrameStore {
    pub frame_number: usize,
    pub timestamp: f64,
    pub people: Vec<SinglePersonSessionData>,
}
