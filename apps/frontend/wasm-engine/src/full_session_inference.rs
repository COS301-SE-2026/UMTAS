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

    for frame in frames {
        for person in frame.people {
            let id = &person.assigned_id;

            if let Some(stored_person) = all_session_people.get_mut(id) {
                stored_person
                    .all_center_mass
                    .push(person.pose_data.center_mass);

                // question logic

                
            } else {
                all_session_people.insert(
                    person.assigned_id,
                    SessionPerson {
                        count_hand_up: if person.hand_up { 1 } else { 0 },
                        last_frame_hand_up: if person.hand_up {
                            Some(frame.frame_number)
                        } else {
                            None
                        },
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
    last_frame_hand_up: Option<usize>,
    assigned_id: usize,
    all_center_mass: Vec<Keypoint>,
}
