import React, { useState } from 'react';
import { AppStatus } from '../types';
import { StopIcon, RecordIcon, ScreenIcon, WebcamIcon, MediaIcon, GraphicIcon, DownloadIcon, ResetIcon, SendIcon } from './icons';

interface ToolbarProps {
  status: AppStatus;
  onStartScreenRecording: () => void;
  onStartWebcamRecording: () => void;
  onStopRecording: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
  onDownload: () => void;
  onReset: () => void;
  onSendMessage: (message: string) => void;
}

const ToolbarButton: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string, 'aria-label': string }> = ({ onClick, disabled, children, className = '', ...props }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-200 rounded-lg hover:bg-gray-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};


const Toolbar: React.FC<ToolbarProps> = ({ 
    status, 
    onStartScreenRecording, 
    onStartWebcamRecording,
    onStopRecording,
    onStartStreaming, 
    onStopStreaming,
    onDownload, 
    onReset,
    onSendMessage
}) => {
    const [message, setMessage] = useState('');
    const isSessionActive = status === AppStatus.Recording || status === AppStatus.Streaming;
    const isIdle = status === AppStatus.Idle || status === AppStatus.Error;

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };
    
    const handleStop = () => {
        if (status === AppStatus.Recording) onStopRecording();
        if (status === AppStatus.Streaming) onStopStreaming();
    }

    return (
        <footer className="w-full fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex justify-center px-4">
            <div className="w-full max-w-xl p-2 bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl flex items-center justify-center gap-2">
                {isIdle && (
                     <>
                        <ToolbarButton onClick={onStartStreaming} aria-label="Start screen stream">
                            <ScreenIcon />
                            <span>Screen</span>
                        </ToolbarButton>
                        <ToolbarButton onClick={onStartScreenRecording} aria-label="Start screen recording">
                            <RecordIcon />
                            <span>Record</span>
                        </ToolbarButton>
                         <ToolbarButton onClick={onStartWebcamRecording} aria-label="Start webcam recording">
                            <WebcamIcon />
                            <span>Webcam</span>
                        </ToolbarButton>
                        <div className="h-6 w-px bg-gray-600"></div>
                        <ToolbarButton disabled aria-label="Add media (disabled)">
                           <MediaIcon />
                            <span>Media</span>
                        </ToolbarButton>
                        <ToolbarButton disabled aria-label="Add graphic (disabled)">
                           <GraphicIcon />
                           <span>Graphic</span>
                        </ToolbarButton>
                    </>
                )}

                {isSessionActive && (
                     <button
                        onClick={handleStop}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                        aria-label={status === AppStatus.Recording ? 'Stop Recording' : 'Stop Stream'}
                    >
                        <StopIcon />
                        Stop
                    </button>
                )}

                {status === AppStatus.Stopped && (
                    <>
                        <button
                            onClick={onDownload}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                        >
                            <DownloadIcon />
                            Download Recording
                        </button>
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-4 py-2.5 font-semibold bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                        >
                            <ResetIcon />
                            New Session
                        </button>
                    </>
                )}
                
                {status === AppStatus.Streaming && (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 flex-grow ml-4">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Send a message..."
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
                            aria-label="Message to send"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-3 py-2.5 font-semibold bg-brand-secondary text-white rounded-lg shadow-md hover:bg-brand-secondary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            disabled={!message.trim()}
                            aria-label="Send message"
                        >
                           <SendIcon />
                        </button>
                    </form>
                )}
            </div>
        </footer>
    );
};

export default Toolbar;