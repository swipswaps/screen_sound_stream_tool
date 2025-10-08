import React, { useState } from 'react';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Controls from './components/Controls';
import { AppStatus } from './types';
import { SendIcon } from './components/icons';

const App: React.FC = () => {
  const {
    status,
    error,
    stream,
    startStreaming,
    stopStreaming,
    reset,
    sendMessage,
  } = useScreenRecorder();

  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-950">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="p-4 sm:p-6">
            <VideoPlayer stream={stream} />
          </div>

          {status === AppStatus.Streaming && (
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message to send with the stream..."
                        className="flex-grow bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                        aria-label="Message to send"
                    />
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2.5 font-semibold bg-brand-secondary text-white rounded-lg shadow-md hover:bg-brand-secondary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!message.trim()}
                        aria-label="Send message"
                    >
                       <SendIcon />
                       <span>Send</span>
                    </button>
                </form>
            </div>
          )}
          
          <div className="bg-gray-950/50 p-4 border-t border-gray-700">
             {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-center text-sm">
                <p><strong>Error:</strong> {error}</p>
                {status === AppStatus.Error && error.includes('streaming server') && (
                    <p className="mt-1 text-xs">Note: Streaming requires a local WebSocket server running on <code>ws://localhost:8080</code>.</p>
                )}
              </div>
            )}
            <Controls
              status={status}
              onStartStreaming={startStreaming}
              onStopStreaming={stopStreaming}
              onReset={reset}
            />
          </div>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Your stream is processed locally in your browser and sent to the server.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;