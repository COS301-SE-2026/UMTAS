// will store the data given for people
// Will also be the frame of reference for the drawers to draw to screen

import { DetectedPersonPose } from "../messageTypes";

// if id is not found in a frame it draws them again
export default class SessionStorePose {
  private frames: frameStore[] = [];
  public constructor() {}
  public sendData(
    frame: number,
    timestamp: number,
    people: DetectedPersonPose[],
  ): void {
    // run wasm and JSON parse the results
  }
  public getLastFrame() {
    return this.frames[this.frames.length - 1];
  }
  /**
   * @brief this does analysis on all frames stored here and returns a special object with anayltics to store in backend
   * RestlessNess => a measure of how much they shift around center mass dot => an average of how much entire class shifts
   * Questions => measure of how many questions were asked => a number of frames in sequence where an id has hand up
   * they cannot be from isInferred
   */

  public analyseAllFrames() {}
}

// this object stores an id and will be used from one frame to the next
// session numbers should only go up
// If a person is not detected by wasm from one frame to next, previous frame is used
export interface SinglePersonSessionData {
  pose_data: DetectedPersonPose;
  assigned_id: number;

  is_inferred: boolean; // if not detected use prev frame

  last_seen_frame: number;
  last_seen_timestamp: number;

  hand_up: boolean; // used if their hand is up wasm sets this to yes
  // main inference function on all session data will use this to detect when
}
// returned by the wasm once all analysis is done
export interface frameStore {
  frame_number: number;
  timestamp: number;
  people: SinglePersonSessionData[];
}
