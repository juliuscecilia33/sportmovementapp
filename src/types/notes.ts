export interface FrameNote {
  id: string;
  frameNumber: number;
  timestamp: number;
  noteText: string;
  createdBy: string; // "Coach" or player name
  createdAt: Date;
}
