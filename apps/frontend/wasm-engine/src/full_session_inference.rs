use image::Frames;
use wasm_bindgen::prelude::*;

use crate::pose_parse::FrameStore;

#[wasm_bindgen]
pub fn analyse_session(frames: JsValue) -> Result<String, JsValue> {
    let frames_parsed: Vec<FrameStore> = serde_wasm_bindgen::from_value(frames)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse people array: {}", e)))?;

    return Ok("".to_string());
}

// needs to analyse per person so accumulate for an ID and then check distance between each and so on
pub fn analyse_questions(frames: Vec<FrameStore>) {

    
}
pub fn analyse_questions_id(frames: Vec<FrameStore>) {

    
}

pub struct session_analysis {
    questions_asked: usize,
    // a measure of everyones center and the average movement of that point
    mean_movement: usize,
}
