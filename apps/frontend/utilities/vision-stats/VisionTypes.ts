export interface SessionInferenceResult {
  questions_asked: number;
  total_restless_frames: number;
  total_stable_frames: number;
  total_paying_attention: number;
  total_no_attention: number;
  total_frames: number;
}
export interface VisionFilters {
  search?: string;
  eventType?: string;
  moduleId?: string;
  from?: string;
  to?: string;
}

export interface VisionEvent {
  activityType: string;
  id: string;
  moduleId: string;
  name: string;
}

export interface VisionModule {
  id: string;
  name: string;
}

export interface VisionSession {
  sessionID: string;
  moduleID: string;
  sessionDescending?: string | null;
  data: SessionInferenceResult;
  eventID?: string | null;
  date: string;
  sessionName: string;
  createdBy?: string | null;
  createdAt: string;
}

export interface SessionMetrics {
  id: string;
  name: string;
  date: string;
  eventId: string | null;
  questions: number;
  engagement: number;
  totalFrames: number;
  attentionPercentage: number;
  restlessPercentage: number;
  stillPercentage: number;
  noAttentionPercentage: number;
}

export interface DailyMetrics {
  date: string;
  sessions: number;
  questions: number;
  engagement: number;
  restlessPercentage: number;
  stillPercentage: number;
  attentionPercentage: number;
  noAttentionPercentage: number;
}
