import React, { useState, useEffect } from 'react';
import { AppStatus } from '../types';
import { StopIcon, RecordIcon, ScreenIcon, WebcamIcon, MediaIcon, GraphicIcon } from './icons';

interface ToolbarProps {
  status: AppStatus;
  onStartScreenShare: () => void;
  onStartWebcam: () => void;
  onStartRecording: () => void;
  onStartStreaming: () => void;
  onStopSession: () => void;
  onAddMedia: () => void;
  onAddGraphic: () => void;
}

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string, tooltip?: string }> = ({ children, className = '', tooltip, ...props }) => {
    return (
        <div className="relative group">
            <button
                {...props}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                {children}
            </button>
            {tooltip && (
                 <div className="absolute bottom-full mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 border border-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {tooltip}
                </div>
            )}
        </div>
    );
};


const Toolbar: React.FC<ToolbarProps> = ({ 
    status,
    onStartScreenShare,
    onStartWebcam,
    onStartRecording,
    onStartStreaming,
    onStopSession,
    onAddMedia,
    onAddGraphic,
}) => {
    const [isServerOnline, setIsServerOnline] = useState(true);
    const hasActiveSession = status === AppStatus.Recording || status === AppStatus.Streaming;
    const hasMediaSource = status !== AppStatus.Idle && status !== AppStatus.Error;

    useEffect(() => {
        const checkServerStatus = () => {
            const socket = new WebSocket('ws://localhost:8080');
            socket.onopen = () => { setIsServerOnline(true); socket.close(); };
            socket.onerror = () => setIsServerOnline(false);
        };
        checkServerStatus();
        const intervalId = setInterval(checkServerStatus, 10000);
        return () => clearInterval(intervalId);
    }, []);

    if (hasActiveSession) {
        return (
             <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 p-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl flex items-center gap-2">
                <Button onClick={onStopSession} aria-label="Stop Session" className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                    <StopIcon />
                    Stop
                </Button>
            </div>
        )
    }

    return (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 p-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl flex items-center gap-2">
            {/* Source Buttons */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-700">
                <Button onClick={onStartScreenShare} disabled={hasMediaSource} aria-label="Share Screen" className="bg-gray-700 hover:bg-gray-600 focus:ring-gray-500">
                    <ScreenIcon />
                    Screen
                </Button>
                 <Button onClick={onStartWebcam} aria-label="Add Webcam" className="bg-gray-700 hover:bg-gray-600 focus:ring-gray-500">
                    <WebcamIcon />
                    Webcam
                </Button>
            </div>
            {/* Overlay Buttons */}
             <div className="flex items-center gap-2 pr-2 border-r border-gray-700">
                <Button onClick={onAddMedia} disabled={!hasMediaSource} aria-label="Add Media" className="bg-gray-700 hover:bg-gray-600 focus:ring-gray-500">
                    <MediaIcon />
                    Media
                </Button>
                <Button onClick={onAddGraphic} disabled={!hasMediaSource} aria-label="Add Graphic" className="bg-gray-700 hover:bg-gray-600 focus:ring-gray-500">
                    <GraphicIcon />
                    Graphic
                </Button>
            </div>

            {/* Action Buttons */}
             <div className="flex items-center gap-2">
                 <Button onClick={onStartRecording} disabled={!hasMediaSource} aria-label="Record" className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                    <RecordIcon />
                    Record
                </Button>
                <Button 
                    onClick={onStartStreaming}
                    disabled={!hasMediaSource || !isServerOnline}
                    tooltip={!isServerOnline ? "Streaming server offline. Run 'npm run start-server'." : "Stream the session"}
                    aria-label="Stream" 
                    className="bg-brand-primary hover:bg-brand-primary/90 focus:ring-brand-primary"
                >
                   Go Live
                </Button>
            </div>
        </div>
    );
};

export default Toolbar;
