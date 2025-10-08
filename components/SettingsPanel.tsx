import React from 'react';
import { CanvasLayer, TextLayer } from '../types';
import { ScreenIcon, WebcamIcon, MediaIcon, GraphicIcon } from './icons';

interface SettingsPanelProps {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<CanvasLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

const LayerIcon = ({ type }: { type: CanvasLayer['type'] | 'screen' | 'webcam' }) => {
    switch(type) {
        case 'screen': return <ScreenIcon className="h-5 w-5" />;
        case 'webcam': return <WebcamIcon className="h-5 w-5" />;
        case 'image': return <MediaIcon className="h-5 w-5" />;
        case 'text': return <GraphicIcon className="h-5 w-5" />;
        default: return null;
    }
}

const getLayerName = (layer: CanvasLayer) => {
    switch(layer.type) {
        case 'video': return layer.sourceType === 'screen' ? 'Screen Share' : 'Webcam';
        case 'image': return 'Image';
        case 'text': return 'Text Graphic';
    }
}

const TextLayerEditor: React.FC<{ layer: TextLayer, onUpdate: (updates: Partial<TextLayer>) => void }> = ({ layer, onUpdate }) => {
    return (
        <div className="space-y-4">
             <div>
                <label className="text-xs text-gray-400 block mb-1">Text Content</label>
                <textarea 
                    value={layer.text}
                    onChange={(e) => onUpdate({ text: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
                    rows={3}
                />
            </div>
             <div className="flex items-center space-x-2">
                 <div className="flex-grow">
                    <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                    <input
                        type="number"
                        value={layer.fontSize}
                        onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value, 10) || 12 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm