// will store the data given for people
// Will also be the frame of reference for the drawers to draw to screen

import { DetectedPersonPose } from "../messageTypes";
import init, {
  analyze_frame,
  first_frame,
} from "../../../wasm-engine/pkg/wasm_engine";

// if id is not found in a frame it draws them again
export default class SessionStorePose {
  private frames: frameStore[] = [];
  private isInitialized = false;
  private initPromise: Promise<unknown>;
  public constructor() {
    this.initPromise = init().then(() => {
      this.isInitialized = true;
    });
  }
  public clear() {
    // clears the frames
    if (this.frames.length != 0) {
      this.frames.length = 0;
    }
  }

  public async ready(): Promise<void> {
    await this.initPromise;
  }

  public async sendFirst(
    frame: number,
    timestamp: number,
    people: DetectedPersonPose[],
  ): Promise<void> {
    // clears the frames
    if (this.frames.length != 0) {
      this.frames.length = 0;
    }
    if (!this.isInitialized) {
      await this.initPromise;
    }
    const result = first_frame(frame, timestamp, people);
    const parsed_frame: frameStore = JSON.parse(result);
    this.frames.push(parsed_frame);
  }

  public async sendData(
    frame: number,
    timestamp: number,
    people: DetectedPersonPose[],
  ): Promise<void> {
    if (this.frames.length === 0) {
      throw Error(
        "The first frame must be sent separately before sending all data",
      );
    }
    if (!this.isInitialized) {
      await this.initPromise;
    }

    const result = analyze_frame(frame, timestamp, this.getLastFrame(), people);
    const parsed_frame: frameStore = JSON.parse(result);
    this.frames.push(parsed_frame);
  }
  public getLastFrame() {
    if (this.getNumFrames() > 0) return this.frames[this.frames.length - 1];
    else return null;
  }
  /**
   * @brief this does analysis on all frames stored here and returns a special object with anayltics to store in backend
   * RestlessNess => a measure of how much they shift around center mass dot => an average of how much entire class shifts
   * Questions => measure of how many questions were asked => a number of frames in sequence where an id has hand up
   * they cannot be from isInferred
   */
  public analyseAllFrames() {}

  public getNumFrames() {
    return this.frames.length;
  }
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
