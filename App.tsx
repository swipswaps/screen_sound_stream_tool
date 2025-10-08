
import React from 'react';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Controls from './components/Controls';
import { RecordingStatus } from './types';

const App: React.FC = () => {
  const {
    status,
    videoUrl,
    error,
    stream,
    startRecording,
    stopRecording,
    downloadRecording,
    reset,
  } = useScreenRecorder();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-950">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="p-4 sm:p-6">
            <VideoPlayer stream={stream} videoUrl={videoUrl} />
          </div>
          <div className="bg-gray-950/50 p-4 border-t border-gray-700">
             {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-center text-sm">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            <Controls
              status={status}
              onStart={startRecording}
              onStop={stopRecording}
              onDownload={downloadRecording}
              onReset={reset}
            />
          </div>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Web APIs. Your recordings are processed locally in your browser.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
