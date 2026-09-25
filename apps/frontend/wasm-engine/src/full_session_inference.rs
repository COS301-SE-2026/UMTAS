use serde::Serialize;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::pose_inference::Keypoint;
use crate::pose_parse::FrameStore;

#[wasm_bindgen]
pub fn analyse_session(frames: JsValue) -> Result<String, JsValue> {
    let frames_parsed: Vec<FrameStore> = serde_wasm_bindgen::from_value(frames)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse people array: {}", e)))?;

    let full_session = get_session_data(frames_parsed);
    let session_data = group_data(full_session);

    return serde_json::to_string(&session_data).map_err(|e| JsValue::from_str(&e.to_string()));
}
pub fn group_data(full_session: HashMap<usize, SessionPerson>) -> SessionAnalysis {
    let mut total_restless: usize = 0;
    let mut total_question: usize = 0;
    let mut total_paying_attention: usize = 0;
    let mut total_no_attention: usize = 0;
    let mut restless_ids: Vec<usize> = Vec::new();

    for (&id, session) in &full_session {
        if let Some(restless_id) = evaluate_restlessness(
            id,
            &session.all_center_mass,
            &session.left_shoulder,
            &session.right_shoulder,
        ) {
            total_restless += 1;
            restless_ids.push(restless_id);
        }
        total_question += session.count_hand_up;
        total_paying_attention += session.gaze_paying_attention_count;
        total_no_attention += session.gaze_no_attention_count;
    }

    let total_frames = total_paying_attention + total_no_attention;

    return SessionAnalysis {
        detected_restless: total_restless,
        questions_asked: total_question,
        restless_ids: restless_ids,
        total_paying_attention,
        total_no_attention,
        total_frames,
    };
}

pub fn evaluate_restlessness(
    id: usize,
    centers: &[Keypoint],
    left_shoulder: &[Keypoint],
    right_shoulder: &[Keypoint],
) -> Option<usize> {
    if left_shoulder.is_empty() || left_shoulder.len() != right_shoulder.len() {
        return None;
    }

    let mut total_shoulder_width = 0.0;
    for i in 0..left_shoulder.len() {
        let dx = left_shoulder[i].x - right_shoulder[i].x;
        let dy = left_shoulder[i].y - right_shoulder[i].y;
        total_shoulder_width += (dx.powi(2) + dy.powi(2)).sqrt();
    }
    let avg_shoulder_width = total_shoulder_width / left_shoulder.len() as f32;

    let mut distances = Vec::new();
    for i in 1..left_shoulder.len() {
        let prev_mid_x = (left_shoulder[i - 1].x + right_shoulder[i - 1].x) / 2.0;
        let prev_mid_y = (left_shoulder[i - 1].y + right_shoulder[i - 1].y) / 2.0;
        let curr_mid_x = (left_shoulder[i].x + right_shoulder[i].x) / 2.0;
        let curr_mid_y = (left_shoulder[i].y + right_shoulder[i].y) / 2.0;

        let dx = curr_mid_x - prev_mid_x;
        let dy = curr_mid_y - prev_mid_y;
        let distance = (dx.powi(2) + dy.powi(2)).sqrt();
        distances.push(distance);
    }

    if distances.is_empty() {
        return None;
    }

    distances.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let p90_idx = ((distances.len() as f32) * 0.90) as usize;
    let p90_distance = distances[p90_idx.min(distances.len() - 1)];
    if p90_distance < avg_shoulder_width * 0.04 {
        return None;
    }

    const R_RATIO: f32 = 0.20;
    let substantial_move = avg_shoulder_width * 0.06;
    let mut restless_frame_count = 0;

    for &dist in &distances {
        if dist > substantial_move {
            restless_frame_count += 1;
        }
    }

    let len = distances.len() as f32;
    let restlessness_ratio = restless_frame_count as f32 / len;

    if restlessness_ratio > R_RATIO {
        return Some(id);
    }

    return None;
}
pub fn get_session_data(frames: Vec<FrameStore>) -> HashMap<usize, SessionPerson> {
    let mut total_frames_count: HashMap<usize, usize> = HashMap::new();
    let mut inferred_frames_count: HashMap<usize, usize> = HashMap::new();

    for frame in &frames {
        for person in &frame.people {
            *total_frames_count.entry(person.assigned_id).or_insert(0) += 1;
            if person.is_inferred {
                *inferred_frames_count.entry(person.assigned_id).or_insert(0) += 1;
            }
        }
    }

    let mut excluded_ids = std::collections::HashSet::new();
    const MAX_INFERRED_RATIO: f32 = 0.5;

    for (&id, &total) in &total_frames_count {
        let inferred = *inferred_frames_count.get(&id).unwrap_or(&0);
        if (inferred as f32 / total as f32) > MAX_INFERRED_RATIO {
            excluded_ids.insert(id);
        }
    }

    // must remain sorted
    let mut all_session_people: HashMap<usize, SessionPerson> = HashMap::new();
    const DISTANCE_BETWEEN_START_END: usize = 5;
    const DISTANCE_BETWEEN_END_NEW: usize = 5;

    for frame in frames {
        for person in frame.people {
            let id = person.assigned_id;

            if excluded_ids.contains(&id) {
                continue;
            }

            let is_paying = person.gaze.looking_straight;
            let is_no_attention = person.gaze.looking_left || person.gaze.looking_right;

            if let Some(stored_person) = all_session_people.get_mut(&id) {
                if !person.is_inferred {
                    stored_person
                        .all_center_mass
                        .push(person.pose_data.center_mass);
                    stored_person
                        .left_shoulder
                        .push(person.pose_data.left_shoulder);
                    stored_person
                        .right_shoulder
                        .push(person.pose_data.right_shoulder);
                }
                if !person.is_inferred && person.pose_data.nose.y > stored_person.highest_nose.y {
                    stored_person.highest_nose = person.pose_data.nose;
                }

                // Accumulate gaze frame counts directly
                if !person.is_inferred {
                    if is_paying {
                        stored_person.gaze_paying_attention_count += 1;
                    }
                    if is_no_attention {
                        stored_person.gaze_no_attention_count += 1;
                    }
                }

                // question logic

                if person.hand_up && !person.is_inferred {
                    if let Some(first_frame_up) = stored_person.first_frame_hand_up
                        && let Some(last_frame_up) = stored_person.last_frame_hand_up
                    {
                        // Hand is up and there has been a hand up before
                        let distance_between_first_last = last_frame_up - first_frame_up;
                        // the hand has been up before but has not gone down
                        if distance_between_first_last > DISTANCE_BETWEEN_START_END {
                            // hand has been up long enough to count the hand up
                            stored_person.count_hand_up += 1;
                            stored_person.first_frame_hand_up = None;
                            stored_person.last_frame_hand_up = None;
                            stored_person.frame_hand_down = Some(frame.frame_number);
                        } else {
                            // hand has not been up long enough for hand to go up
                            stored_person.last_frame_hand_up = Some(frame.frame_number);
                        }
                    } else {
                        // either hand was never up or hand has gone down
                        if let Some(hand_went_down) = stored_person.frame_hand_down {
                            // the hand has been up before and has gone down
                            let distance_between_down_new = frame.frame_number - hand_went_down;

                            if distance_between_down_new > DISTANCE_BETWEEN_END_NEW {
                                // hand has been up down long enough to begin again
                                stored_person.first_frame_hand_up = Some(frame.frame_number);
                                stored_person.last_frame_hand_up = Some(frame.frame_number);
                                stored_person.frame_hand_down = None;
                            } else {
                                // hand has not gone down since last time update it to current frame
                                stored_person.frame_hand_down = Some(frame.frame_number);
                            }
                        } else {
                            // hand went down and start and end were Not set
                            stored_person.first_frame_hand_up = Some(frame.frame_number);
                            stored_person.last_frame_hand_up = Some(frame.frame_number);
                        }
                    }
                } else {
                    // will clear the old time stamp if the hand has been down for long
                    if let Some(hand_went_down) = stored_person.frame_hand_down {
                        // the hand has been up before and has gone down
                        let distance_between_down_new = frame.frame_number - hand_went_down;

                        if distance_between_down_new > DISTANCE_BETWEEN_END_NEW {
                            stored_person.frame_hand_down = None;
                        }
                    }
                }
            } else {
                all_session_people.insert(
                    person.assigned_id,
                    SessionPerson {
                        highest_nose: person.pose_data.nose,
                        count_hand_up: if person.hand_up { 1 } else { 0 },
                        first_frame_hand_up: if person.hand_up {
                            Some(frame.frame_number)
                        } else {
                            None
                        },
                        last_frame_hand_up: if person.hand_up {
                            Some(frame.frame_number)
                        } else {
                            None
                        },
                        frame_hand_down: None,
                        gaze_paying_attention_count: if is_paying && !person.is_inferred {
                            1
                        } else {
                            0
                        },
                        gaze_no_attention_count: if is_no_attention && !person.is_inferred {
                            1
                        } else {
                            0
                        },
                        assigned_id: person.assigned_id,
                        all_center_mass: [person.pose_data.center_mass].to_vec(),
                        left_shoulder: [person.pose_data.left_shoulder].to_vec(),
                        right_shoulder: [person.pose_data.right_shoulder].to_vec(),
                    },
                );
            }
        }
    }
    return all_session_people;
}

#[derive(Serialize)]
pub struct SessionAnalysis {
    questions_asked: usize,
    // a measure of everyones center and the average movement of that point
    detected_restless: usize,
    restless_ids: Vec<usize>,
    total_paying_attention: usize,
    total_no_attention: usize,
    total_frames: usize,
}

#[derive(Clone)]
pub struct SessionPerson {
    count_hand_up: usize,
    first_frame_hand_up: Option<usize>,
    last_frame_hand_up: Option<usize>,
    frame_hand_down: Option<usize>,
    gaze_paying_attention_count: usize,
    gaze_no_attention_count: usize,
    assigned_id: usize,
    highest_nose: Keypoint,
    all_center_mass: Vec<Keypoint>,
    left_shoulder: Vec<Keypoint>,
    right_shoulder: Vec<Keypoint>,
}
