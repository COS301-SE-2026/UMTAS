export type MessageType =
  | "DETECT"
  | "POSE"
  | "DETECT_FREE"
  | "POSE_FREE"
  | "DETECT_DATA"
  | "POSE_DATA"
  | "PROCESS_DETECT_DATA"
  | "PROCESS_POSE_DATA"
  | "DETECT_DATA_PARSED"
  | "POSE_DATA_PARSED";

export type VisionModelEvent<Tmessage extends MessageType, PayloadType> = {
  eventType: Tmessage;
  payload: PayloadType;
};

export type PIXEL_PAYLOAD = {
  pixelData: Uint8ClampedArray;
  width: number;
  height: number;
};

export type DETECT_MESSAGE = VisionModelEvent<"DETECT", PIXEL_PAYLOAD>;
export type POSE_MESSAGE = VisionModelEvent<"POSE", PIXEL_PAYLOAD>;

export type DETECT_DATA_PAYLOAD = {
  results: Float32Array[];
};

export type DETECT_DATA_MESSAGE = VisionModelEvent<
  "DETECT_DATA",
  DETECT_DATA_PAYLOAD
>;

export type POSE_DATA_MESSAGE = VisionModelEvent<
  "POSE_DATA",
  DETECT_DATA_PAYLOAD
>;

export type PROCESS_DETECT_DATA_PAYLOAD = {
  sliced_results: Float32Array[];
};

export type PROCESS_DETECT_DATA_MESSAGE = VisionModelEvent<
  "PROCESS_DETECT_DATA",
  PROCESS_DETECT_DATA_PAYLOAD
>;

export interface DetectedPerson {
  center_x: number;
  center_y: number;
  top_left_x: number;
  top_left_y: number;
  width: number;
  height: number;
  confidence: number;
}

export type PROCESS_DETECT_DATA_RESULT = DetectedPerson[];

export type RESULT_PROCESS_DETECT_DATA = VisionModelEvent<
  "DETECT_DATA_PARSED",
  PROCESS_DETECT_DATA_RESULT
>;

export type PROCESS_POSE_DATA_MESSAGE = VisionModelEvent<
  "PROCESS_POSE_DATA",
  PROCESS_DETECT_DATA_PAYLOAD //same thing?
>;

export type RESULT_PROCESS_POSE_DATA = VisionModelEvent<
  "POSE_DATA_PARSED",
  DetectedPersonPose[]
>;

export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export interface DetectedPersonPose {
  person: DetectedPerson;
  nose: Keypoint;
  center_mass: Keypoint;
  left_shoulder: Keypoint;
  left_arm: Keypoint[]; // [left_elbow, left_wrist]
  right_shoulder: Keypoint;
  right_arm: Keypoint[]; // [right_elbow, right_wrist]
}
