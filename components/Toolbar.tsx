import React, { useState, useEffect, useRef } from 'react';
import { RecordingStatus } from '../types';
import { ScreenIcon, RecordIcon, WebcamIcon, MediaIcon, GraphicIcon, StopIcon, ChevronDownIcon, SettingsIcon } from './icons';

interface ToolbarProps {
  status: RecordingStatus;
  onScreen: () => void;
  onWebcam: (deviceId: string) => void;
  onRecord: () => void;
  onStop: () => void;
  onMedia: () => void;
  onGraphic: () => void;
  onToggleSettings: () => void;
  isSettingsPanelOpen: boolean;
}

// FIX: Define a props interface for ToolbarButton to fix incorrect 'children' prop missing error.
interface ToolbarButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const ToolbarButton = ({ children, onClick, disabled = false, className = '' }: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center p-2 rounded-md space-y-1 w-20 h-20 transition-colors
      ${disabled
        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
        : 'bg-gray-700 text-gray-300 hover:bg-brand-primary hover:text-white'
      } ${className}`}
  >
    {children}
  </button>
);

const WebcamButton = ({ onWebcam, disabled }: { onWebcam: (deviceId: string) => void, disabled: boolean }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({video: true}); // Request permission
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(allDevices.filter(d => d.kind === 'videoinput'));
      } catch (e) {
        console.error("Could not get video devices", e);
      }
    };
    getDevices();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (deviceId: string) => {
    onWebcam(deviceId);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
        <ToolbarButton onClick={() => setIsOpen(prev => !prev)} disabled={disabled}>
            <div className="flex items-center space-x-1">
                <WebcamIcon className="h-8 w-8" />
                <ChevronDownIcon className="h-4 w-4" />
            </div>
            <span className="text-xs">Webcam</span>
        </ToolbarButton>
        {isOpen && devices.length > 0 && (
             <div className="absolute bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                {devices.map(device => (
                    <button 
                        key={device.deviceId} 
                        onClick={() => handleSelect(device.deviceId)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-brand-primary hover:text-white"
                    >
                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </button>
                ))}
            </div>
        )}
    </div>
  )
}

const Toolbar: React.FC<ToolbarProps> = ({ status, onScreen, onWebcam, onRecord, onStop, onMedia, onGraphic, onToggleSettings, isSettingsPanelOpen }) => {
  const isSessionActive = status === 'session' || status === 'recording';

  return (
    <footer className="w-full flex justify-center p-4">
      <div className="flex items-center space-x-4 bg-gray-900/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700">
        <ToolbarButton onClick={onScreen}>
          <ScreenIcon className="h-8 w-8" />
          <span className="text-xs">Screen</span>
        </ToolbarButton>
        <WebcamButton onWebcam={onWebcam} disabled={false} />
        <ToolbarButton onClick={onMedia}>
            <MediaIcon className="h-8 w-8" />
            <span className="text-xs">Media</span>
        </ToolbarButton>
        <ToolbarButton onClick={onGraphic}>
            <GraphicIcon className="h-8 w-8" />
            <span className="text-xs">Graphic</span>
        </ToolbarButton>

        <ToolbarButton onClick={onToggleSettings} disabled={!isSessionActive} className={isSessionActive && isSettingsPanelOpen ? 'bg-brand-primary text-white' : ''}>
          <SettingsIcon className="h-8 w-8" />
          <span className="text-xs">Settings</span>
        </ToolbarButton>
        
        <div className="w-px h-16 bg-gray-700" />

        <ToolbarButton onClick={onRecord} disabled={status !== 'session'} className={status === 'recording' ? '!bg-red-500 !text-white' : ''}>
          <RecordIcon className="h-8 w-8" />
          <span className="text-xs">{status === 'recording' ? 'Recording' : 'Record'}</span>
        </ToolbarButton>
        <ToolbarButton onClick={onStop} disabled={!isSessionActive} className="!bg-red-600 hover:!bg-red-700 text-white">
            <StopIcon className="h-8 w-8" />
            <span className="text-xs">Stop</span>
        </ToolbarButton>
      </div>
    </footer>
  );
};

export default Toolbar;