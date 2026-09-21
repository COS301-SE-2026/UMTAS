use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::pose_inference::Keypoint;
use crate::pose_parse::FrameStore;

#[wasm_bindgen]
pub fn analyse_session(frames: JsValue) -> Result<String, JsValue> {
    let frames_parsed: Vec<FrameStore> = serde_wasm_bindgen::from_value(frames)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse people array: {}", e)))?;

    return Ok("".to_string());
}

// needs to analyse per person so accumulate for an ID and then check distance between each and so on
pub fn analyse_questions(frames: Vec<FrameStore>) {
    // must remain sorted
    let mut all_session_people: HashMap<usize, SessionPerson> = HashMap::new();
    const DISTANCE_BETWEEN_START_END: usize = 10;
    const DISTANCE_BETWEEN_END_NEW: usize = 10;

    for frame in frames {
        for person in frame.people {
            let id = &person.assigned_id;

            if let Some(stored_person) = all_session_people.get_mut(id) {
                stored_person
                    .all_center_mass
                    .push(person.pose_data.center_mass);

                // question logic

                if person.hand_up {
                    if let Some(first_frame_up) = stored_person.first_frame_hand_up
                        && let Some(last_frame_up) = stored_person.last_frame_hand_up
                    {
                        // Hand is up and there has been a hand up before

                        let distance_between_first_last = last_frame_up - first_frame_up;
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
                        }
                    } else {
                        // hand is up there was not a hand before
                        stored_person.first_frame_hand_up = Some(frame.frame_number);
                        stored_person.last_frame_hand_up = Some(frame.frame_number);
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
}

pub struct session_analysis {
    questions_asked: usize,
    // a measure of everyones center and the average movement of that point
    mean_movement: usize,
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
