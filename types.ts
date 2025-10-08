export enum AppStatus {
  Idle = 'idle',
  // A source (screen/webcam) has been selected, but not yet recording/streaming
  Ready = 'ready', 
  Recording = 'recording',
  Streaming = 'streaming',
  Error = 'error',
}

export interface VideoLayer {
  id: string;
  type: 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  mediaElement: HTMLVideoElement; // Hidden video element playing the stream
}

export interface ImageLayer {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  image: ImageBitmap;
}

export interface TextLayer {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  font: string;
  color: string;
  maxWidth: number;
}


export type CanvasLayer = VideoLayer | ImageLayer | TextLayer;
