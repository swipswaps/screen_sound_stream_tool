import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="w-full aspect-video bg-black/30 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-700 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 font-medium">Your screen stream will appear here</p>
        <p className="text-gray-600 text-sm mt-1">Click "Start Stream" to begin</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls={false}
      autoPlay
      playsInline
      muted // Mute live preview to avoid audio feedback
      className="w-full aspect-video bg-black rounded-lg shadow-lg"
    />
  );
};

export default VideoPlayer;