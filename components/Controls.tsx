import React from 'react';
import { AppStatus } from '../types';
import { RecordIcon, StopIcon, DownloadIcon, ResetIcon, StreamIcon } from './icons';

interface ControlsProps {
  status: AppStatus;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
  onDownload: () => void;
  onReset: () => void;
}

const StatusIndicator: React.FC<{ status: AppStatus }> = ({ status }) => {
    let text = "Ready";
    let color = "bg-gray-500";

    if (status === AppStatus.Recording) {
        text = "Recording...";
        color = "bg-red-500 animate-pulse";
    } else if (status === AppStatus.Streaming) {
        text = "Streaming...";
        color = "bg-blue-500 animate-pulse";
    } else if (status === AppStatus.Stopped) {
        text = "Finished";
        color = "bg-green-500";
    } else if (status === AppStatus.Error) {
        text = "Error";
        color = "bg-yellow-500";
    }

    return (
        <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
            <span>{text}</span>
        </div>
    );
};


const Controls: React.FC<ControlsProps> = ({ status, onStartRecording, onStopRecording, onStartStreaming, onStopStreaming, onDownload, onReset }) => {
  const isRecording = status === AppStatus.Recording;
  const isStreaming = status === AppStatus.Streaming;
  const isStopped = status === AppStatus.Stopped;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <StatusIndicator status={status} />
        {(isStopped || status === AppStatus.Error) && (
           <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 font-semibold bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 text-sm"
            >
              <ResetIcon />
              New Session
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recording Panel */}
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex flex-col justify-center gap-3 min-h-[120px]">
          <h3 className="font-semibold text-gray-300 text-center mb-2">Screen Recording</h3>
            {!isRecording && (
               <button
                onClick={onStartRecording}
                disabled={isStreaming}
                className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-brand-primary text-white rounded-lg shadow-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RecordIcon />
                Start Recording
              </button>
            )}

            {isRecording && (
              <button
                onClick={onStopRecording}
                className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
              >
                <StopIcon />
                Stop Recording
              </button>
            )}

            {isStopped && (
               <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
              >
                <DownloadIcon />
                Download
              </button>
            )}
        </div>

        {/* Streaming Panel */}
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex flex-col justify-center gap-3 min-h-[120px]">
           <h3 className="font-semibold text-gray-300 text-center mb-2">Live Streaming</h3>
            {!isStreaming && (
              <button
                onClick={onStartStreaming}
                disabled={isRecording}
                className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <StreamIcon />
                Start Stream
              </button>
            )}

            {isStreaming && (
              <button
                onClick={onStopStreaming}
                className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
              >
                <StopIcon />
                Stop Stream
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Controls;