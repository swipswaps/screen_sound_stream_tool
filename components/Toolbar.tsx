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

interface ToolbarButtonProps {
  children: React.ReactNode;
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
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDevices = async () => {
      try {
        // Ensure we have permission before enumerating
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        return videoDevices;
      } catch (e) {
        console.error("Could not get video devices", e);
        // Silently fail is okay, user might not have a webcam
        setDevices([]);
        return [];
      }
  };

  const handleClick = async () => {
      if (isOpen) {
          setIsOpen(false);
          return;
      }
      
      const videoDevices = await getDevices();
      if (videoDevices.length > 0) {
          if (videoDevices.length === 1) {
              // If only one device, use it immediately
              handleSelect(videoDevices[0].deviceId);
          } else {
              setIsOpen(true);
          }
      } else {
          console.log("No video devices found or permission denied.");
      }
  }

  const handleSelect = (deviceId: string) => {
    onWebcam(deviceId);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
        {/* FIX: (Line 95) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={handleClick} disabled={disabled}>
            <div className="flex items-center space-x-1">
                <WebcamIcon className="h-8 w-8" />
                <ChevronDownIcon className="h-4 w-4" />
            </div>
            <span className="text-xs">Webcam</span>
        </ToolbarButton>
        {isOpen && devices.length > 1 && (
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
        {/* FIX: (Line 125) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={onScreen}>
          <ScreenIcon className="h-8 w-8" />
          <span className="text-xs">Screen</span>
        </ToolbarButton>
        <WebcamButton onWebcam={onWebcam} disabled={false} />
        {/* FIX: (Line 130) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={onMedia}>
            <MediaIcon className="h-8 w-8" />
            <span className="text-xs">Media</span>
        </ToolbarButton>
        {/* FIX: (Line 134) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={onGraphic}>
            <GraphicIcon className="h-8 w-8" />
            <span className="text-xs">Graphic</span>
        </ToolbarButton>

        {/* FIX: (Line 139) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={onToggleSettings} disabled={!isSessionActive} className={isSessionActive && isSettingsPanelOpen ? 'bg-brand-primary text-white' : ''}>
          <SettingsIcon className="h-8 w-8" />
          <span className="text-xs">Settings</span>
        </ToolbarButton>
        
        <div className="w-px h-16 bg-gray-700" />

        {/* FIX: (Line 146) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={onRecord} disabled={status !== 'session'} className={status === 'recording' ? '!bg-red-500 !text-white' : ''}>
          <RecordIcon className="h-8 w-8" />
          <span className="text-xs">{status === 'recording' ? 'Recording' : 'Record'}</span>
        </ToolbarButton>
        {/* FIX: (Line 150) Add children to ToolbarButton to satisfy the 'children' prop requirement. */}
        <ToolbarButton onClick={onStop} disabled={!isSessionActive} className="!bg-red-600 hover:!bg-red-700 text-white">
            <StopIcon className="h-8 w-8" />
            <span className="text-xs">Stop</span>
        </ToolbarButton>
      </div>
    </footer>
  );
};

export default Toolbar;