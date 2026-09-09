use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    right + left
}

#[wasm_bindgen]
pub fn print_rust(num: i32) {
    web_sys::console::log_1(&format!("Number from WASM: {}", num).into());
}
