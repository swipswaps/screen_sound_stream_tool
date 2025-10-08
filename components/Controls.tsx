
import React from 'react';
import { RecordingStatus } from '../types';
import { RecordIcon, StopIcon, DownloadIcon, ResetIcon } from './icons';

interface ControlsProps {
  status: RecordingStatus;
  onStart: () => void;
  onStop: () => void;
  onDownload: () => void;
  onReset: () => void;
}

const StatusIndicator: React.FC<{ status: RecordingStatus }> = ({ status }) => {
    let text = "Ready to record";
    let color = "bg-gray-500";

    if (status === RecordingStatus.Recording) {
        text = "Recording...";
        color = "bg-red-500 animate-pulse";
    } else if (status === RecordingStatus.Stopped) {
        text = "Recording finished";
        color = "bg-blue-500";
    } else if (status === RecordingStatus.Error) {
        text = "Error occurred";
        color = "bg-yellow-500";
    }

    return (
        <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
            <span>{text}</span>
        </div>
    );
};


const Controls: React.FC<ControlsProps> = ({ status, onStart, onStop, onDownload, onReset }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <StatusIndicator status={status} />
      <div className="flex items-center gap-3">
        {status === RecordingStatus.Idle || status === RecordingStatus.Error ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold bg-brand-primary text-white rounded-lg shadow-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
          >
            <RecordIcon />
            Start Recording
          </button>
        ) : null}

        {status === RecordingStatus.Recording ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
          >
            <StopIcon />
            Stop Recording
          </button>
        ) : null}

        {status === RecordingStatus.Stopped ? (
          <>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2.5 font-semibold bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
            >
              <ResetIcon />
              Record Again
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-5 py-2.5 font-semibold bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
            >
              <DownloadIcon />
              Download
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Controls;
