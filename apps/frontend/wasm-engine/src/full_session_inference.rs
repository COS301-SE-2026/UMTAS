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

    for (id, session) in full_session {
        if evaluate_restlessness(&session.all_center_mass) {
            total_restless += 1;
        }
        total_question += session.count_hand_up;
    }

    return SessionAnalysis {
        detected_restless: total_restless,
        questions_asked: total_question,
        restless_ids: [0].to_vec(),
    };
}

pub fn evaluate_restlessness(centers: &[Keypoint]) -> bool {
    if centers.is_empty() {
        return false;
    }

    const NOISE: f32 = 10.0;
    // ratio of how many frames they are expected to be moving for
    const R_RATIO: f32 = 0.3;

    let mut sumx = 0.0;
    let mut sumy = 0.0;
    for kp in centers {
        sumx += kp.x;
        sumy += kp.y;
    }
    let len = centers.len() as f32;
    let baseline_x = sumx / len;
    let baseline_y = sumy / len;

    let mut restless_frame_count = 0;

    for kp in centers {
        let dx = kp.x - baseline_x;
        let dy = kp.y - baseline_y;
        let distance = (dx.powi(2) + dy.powi(2)).sqrt();

        if distance > NOISE {
            restless_frame_count += 1;
        }
    }

    let restlessness_ratio = restless_frame_count as f32 / len;

    return restlessness_ratio > R_RATIO;
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

            if let Some(stored_person) = all_session_people.get_mut(&id) {
                if !person.is_inferred {
                    stored_person
                        .all_center_mass
                        .push(person.pose_data.center_mass);
                }
                // question logic

                if person.hand_up {
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
                        assigned_id: person.assigned_id,
                        all_center_mass: [person.pose_data.center_mass].to_vec(),
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
}

#[derive(Clone)]
pub struct SessionPerson {
    count_hand_up: usize,
    first_frame_hand_up: Option<usize>,
    last_frame_hand_up: Option<usize>,
    frame_hand_down: Option<usize>,
    assigned_id: usize,
    all_center_mass: Vec<Keypoint>,
}
