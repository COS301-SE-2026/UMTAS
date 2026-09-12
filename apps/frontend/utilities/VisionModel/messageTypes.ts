export type MessageType =
  | "DETECT"
  | "POSE"
  | "DETECT_FREE"
  | "POSE_FREE"
  | "DETECT_DATA"
  | "DETECT_POSE"
  | "DETECT_DATA_PARSED"
  | "POSE_DATA_PARSED";

export type VisionModelEvent<PayloadType> = {
  eventType: MessageType;
  payload: PayloadType;
};

export type PIXEL_PAYLOAD = {
  pixelData: Uint8ClampedArray;
  width: number;
  height: number;
};

export type DETECT_MESSAGE = VisionModelEvent<PIXEL_PAYLOAD>;
