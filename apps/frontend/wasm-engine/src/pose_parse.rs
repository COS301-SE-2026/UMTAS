use crate::pose_inference::{DetectedPersonPose, Keypoint};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// this must ensure that the first frame is handled in different step
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
