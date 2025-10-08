export type RecordingStatus = 'idle' | 'session' | 'recording' | 'stopped';

export interface Layer {
  id: string;
  type: 'video' | 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface VideoLayer extends Layer {
  type: 'video';
  stream: MediaStream;
  element: HTMLVideoElement;
  sourceType: 'screen' | 'webcam';
}

export interface ImageLayer extends Layer {
  type: 'image';
  element: HTMLImageElement;
}

export interface TextLayer extends Layer {
  type: 'text';
  text: string;
  font: string;
  color: string;
}

export type CanvasLayer = VideoLayer | ImageLayer | TextLayer;
