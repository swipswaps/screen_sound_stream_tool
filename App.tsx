import React from 'react';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import Toolbar from './components/Toolbar';
import { AppStatus } from './types';

const App: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const {
    status,
    error,
    startScreenShare,
    startWebcam,
    startRecording,
    startStreaming,
    stopSession,
    addMediaOverlay,
    addGraphicOverlay,
  } = useScreenRecorder(canvasRef);

  const hasActiveSession = status === AppStatus.Recording || status === AppStatus.Streaming;

  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-black relative">
       {error && (
          <div className="absolute top-4 left-4 right-4 z-20 max-w-2xl mx-auto p-3 bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg text-center text-sm shadow-lg">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
      
      <main className="w-full h-full flex items-center justify-center">
        {status === AppStatus.Idle || status === AppStatus.Error ? (
           <div className="text-center text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
             <h1 className="mt-4 text-3xl font-bold text-gray-400">Stream Studio</h1>
             <p className="mt-2 text-lg">Click a source on the toolbar below to start.</p>
           </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        )}
      </main>
      
      <Toolbar 
        status={status}
        onStartScreenShare={startScreenShare}
        onStartWebcam={startWebcam}
        onStartRecording={startRecording}
        onStartStreaming={startStreaming}
        onStopSession={stopSession}
        onAddMedia={addMediaOverlay}
        onAddGraphic={addGraphicOverlay}
      />
    </div>
  );
};

export default App;
