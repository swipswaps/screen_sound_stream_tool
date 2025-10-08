import React, { useState } from 'react';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import VideoPlayer from './components/VideoPlayer';
import Toolbar from './components/Toolbar';
import { AppStatus } from './types';
import { ScreenIcon as WelcomeScreenIcon } from './components/icons';

const App: React.FC = () => {
  const {
    status,
    error,
    stream,
    videoUrl,
    startScreenRecording,
    startWebcamRecording,
    stopRecording,
    startStreaming,
    stopStreaming,
    reset,
    sendMessage,
  } = useScreenRecorder();

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isSessionActive = status === AppStatus.Recording || status === AppStatus.Streaming;
  const showVideo = stream || videoUrl;

  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-center text-sm shadow-lg">
          <p><strong>Error:</strong> {error}</p>
          {status === AppStatus.Error && error.includes('streaming server') && (
              <p className="mt-1 text-xs">Note: Streaming requires a local WebSocket server running on <code>ws://localhost:8080</code>.</p>
          )}
        </div>
      )}

      <main className="w-full h-full flex items-center justify-center">
        {showVideo ? (
          <div className="w-full max-w-6xl aspect-video">
             <VideoPlayer stream={stream} videoUrl={videoUrl} />
          </div>
        ) : (
          <div className="text-center">
            <WelcomeScreenIcon className="h-16 w-16 mx-auto text-gray-700" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-200">Stream Studio</h1>
            <p className="mt-2 text-lg text-gray-500">
              Click an option on the toolbar below to start sharing.
            </p>
          </div>
        )}
      </main>
      
      <Toolbar
        status={status}
        onStartScreenRecording={startScreenRecording}
        onStartWebcamRecording={startWebcamRecording}
        onStopRecording={stopRecording}
        onStartStreaming={startStreaming}
        onStopStreaming={stopStreaming}
        onDownload={handleDownload}
        onReset={reset}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

export default App;