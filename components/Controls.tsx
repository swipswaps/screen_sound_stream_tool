import React from 'react';
import { AppStatus } from '../types';
import { StopIcon, ResetIcon, StreamIcon } from './icons';

interface ControlsProps {
  status: AppStatus;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
  onReset: () => void;
}

const StatusIndicator: React.FC<{ status: AppStatus }> = ({ status }) => {
    let text = "Ready";
    let color = "bg-gray-500";

    if (status === AppStatus.Streaming) {
        text = "Streaming...";
        color = "bg-blue-500 animate-pulse";
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

const Controls: React.FC<ControlsProps> = ({ status, onStartStreaming, onStopStreaming, onReset }) => {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
        <StatusIndicator status={status} />
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 min-h-[44px]">
            {status === AppStatus.Idle && (
                <button
                    onClick={onStartStreaming}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                >
                    <StreamIcon />
                    Start Stream
                </button>
            )}
            
            {status === AppStatus.Streaming && (
                <button
                    onClick={onStopStreaming}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                >
                    <StopIcon />
                    Stop Stream
                </button>
            )}
            
             {status === AppStatus.Error && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2.5 font-semibold bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                >
                    <ResetIcon />
                    Try Again
                </button>
            )}
        </div>
    </div>
  );
};

export default Controls;