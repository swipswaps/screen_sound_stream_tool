import React from 'react';
import { CanvasLayer, TextLayer, VideoLayer } from '../types';
import { ScreenIcon, WebcamIcon, MediaIcon, GraphicIcon } from './icons';

interface SettingsPanelProps {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<CanvasLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

const LayerIcon = ({ type, sourceType }: { type: CanvasLayer['type'], sourceType?: 'screen' | 'webcam' }) => {
    if (type === 'video') {
        return sourceType === 'screen' ? <ScreenIcon className="h-5 w-5" /> : <WebcamIcon className="h-5 w-5" />;
    }
    switch(type) {
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

const commonInputClass = "w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary";

const CommonLayerEditor: React.FC<{ layer: CanvasLayer, onUpdate: (updates: Partial<CanvasLayer>) => void }> = ({ layer, onUpdate }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">X</label>
                    <input type="number" value={Math.round(layer.x)} onChange={(e) => onUpdate({ x: parseInt(e.target.value, 10) || 0 })} className={commonInputClass} />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Y</label>
                    <input type="number" value={Math.round(layer.y)} onChange={(e) => onUpdate({ y: parseInt(e.target.value, 10) || 0 })} className={commonInputClass} />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Width</label>
                    <input type="number" value={Math.round(layer.width)} onChange={(e) => onUpdate({ width: parseInt(e.target.value, 10) || 0 })} className={commonInputClass} />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Height</label>
                    <input type="number" value={Math.round(layer.height)} onChange={(e) => onUpdate({ height: parseInt(e.target.value, 10) || 0 })} className={commonInputClass} />
                </div>
            </div>
             <div>
                <label className="text-xs text-gray-400 block mb-1">Opacity</label>
                <input type="range" min="0" max="1" step="0.01" value={layer.opacity} onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })} className="w-full" />
            </div>
        </div>
    )
}

const VideoLayerEditor: React.FC<{ layer: VideoLayer, onUpdate: (updates: Partial<VideoLayer>) => void }> = ({ layer, onUpdate }) => {
    if (layer.sourceType !== 'webcam') {
        return null;
    }

    return (
        <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-300">Chroma Key</h4>
            <div className="flex items-center justify-between">
                <label htmlFor="chroma-toggle" className="text-sm text-gray-300">Enable</label>
                <button
                    role="switch"
                    aria-checked={layer.chromaKeyEnabled}
                    id="chroma-toggle"
                    onClick={() => onUpdate({ chromaKeyEnabled: !layer.chromaKeyEnabled })}
                    className={`${layer.chromaKeyEnabled ? 'bg-brand-primary' : 'bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-gray-900`}
                >
                    <span className={`${layer.chromaKeyEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
            </div>
            {layer.chromaKeyEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-700">
                    <div className="flex items-center space-x-4">
                         <label className="text-sm text-gray-400">Key Color</label>
                         <input
                            type="color"
                            value={layer.chromaKeyColor}
                            onChange={(e) => onUpdate({ chromaKeyColor: e.target.value })}
                            className="w-10 h-10 p-0 border-0 bg-transparent rounded-md cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Similarity ({Math.round((layer.chromaKeySimilarity ?? 0) * 100)})</label>
                        <input type="range" min="0" max="1" step="0.01" value={layer.chromaKeySimilarity} onChange={(e) => onUpdate({ chromaKeySimilarity: parseFloat(e.target.value) })} className="w-full" />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 block mb-1">Smoothness ({Math.round((layer.chromaKeySmoothness ?? 0) * 100)})</label>
                        <input type="range" min="0" max="1" step="0.01" value={layer.chromaKeySmoothness} onChange={(e) => onUpdate({ chromaKeySmoothness: parseFloat(e.target.value) })} className="w-full" />
                    </div>
                </div>
            )}
        </div>
    );
}

const TextLayerEditor: React.FC<{ layer: TextLayer, onUpdate: (updates: Partial<TextLayer>) => void }> = ({ layer, onUpdate }) => {
    return (
        <div className="space-y-4">
             <div>
                <label className="text-xs text-gray-400 block mb-1">Text Content</label>
                <textarea 
                    value={layer.text}
                    onChange={(e) => onUpdate({ text: e.target.value })}
                    className={commonInputClass}
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
                        className={commonInputClass}
                    />
                 </div>
                 <div className="w-20">
                     <label className="text-xs text-gray-400 block mb-1">Color</label>
                     <input
                        type="color"
                        value={layer.color}
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer"
                    />
                 </div>
             </div>
             <div className="flex items-center space-x-2">
                 <div className="flex-grow">
                    <label className="text-xs text-gray-400 block mb-1">Font Family</label>
                    <select value={layer.fontFamily} onChange={e => onUpdate({ fontFamily: e.target.value })} className={commonInputClass}>
                        <option>Arial</option>
                        <option>Verdana</option>
                        <option>Georgia</option>
                        <option>Times New Roman</option>
                        <option>Courier New</option>
                        <option>Comic Sans MS</option>
                    </select>
                 </div>
                 <div className="flex-grow">
                    <label className="text-xs text-gray-400 block mb-1">Font Weight</label>
                     <select value={layer.fontWeight} onChange={e => onUpdate({ fontWeight: e.target.value })} className={commonInputClass}>
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="lighter">Lighter</option>
                        <option value="bolder">Bolder</option>
                     </select>
                 </div>
             </div>
        </div>
    );
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ layers, selectedLayerId, onSelectLayer, onUpdateLayer, onRemoveLayer, onMoveLayer }) => {
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const reversedLayers = [...layers].reverse();

  return (
    <div className="w-96 bg-gray-900 rounded-lg shadow-lg flex flex-col p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Layers</h2>
        <div className="space-y-2">
            {reversedLayers.map(layer => (
                <div 
                    key={layer.id} 
                    onClick={() => onSelectLayer(layer.id)}
                    className={`p-2 rounded-md cursor-pointer border-2 transition-colors ${selectedLayerId === layer.id ? 'border-brand-primary bg-brand-primary/20' : 'border-transparent hover:bg-gray-800'}`}
                >
                    <div className="flex items-center space-x-3">
                         <LayerIcon type={layer.type} sourceType={layer.type === 'video' ? layer.sourceType : undefined} />
                         <span className="flex-grow text-sm font-medium">{getLayerName(layer)}</span>
                         <input type="checkbox" title="Toggle visibility" checked={layer.visible} onChange={e => onUpdateLayer(layer.id, { visible: e.target.checked })} onClick={e => e.stopPropagation()} className="form-checkbox h-4 w-4 text-brand-primary bg-gray-800 border-gray-600 rounded focus:ring-brand-primary" />
                         <button title="Move Up" onClick={e => {e.stopPropagation(); onMoveLayer(layer.id, 'up')}} className="p-1 rounded hover:bg-gray-700">&uarr;</button>
                         <button title="Move Down" onClick={e => {e.stopPropagation(); onMoveLayer(layer.id, 'down')}} className="p-1 rounded hover:bg-gray-700">&darr;</button>
                         <button title="Remove" onClick={e => {e.stopPropagation(); onRemoveLayer(layer.id)}} className="p-1 rounded hover:bg-red-500/50 text-red-400">&times;</button>
                    </div>
                </div>
            ))}
        </div>

        {selectedLayer && (
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Edit: {getLayerName(selectedLayer)}</h3>
                <div className="space-y-6">
                    <CommonLayerEditor layer={selectedLayer} onUpdate={(updates) => onUpdateLayer(selectedLayer.id, updates)} />
                    {selectedLayer.type === 'video' && (
                        <VideoLayerEditor layer={selectedLayer as VideoLayer} onUpdate={(updates) => onUpdateLayer(selectedLayer.id, updates)} />
                    )}
                    {selectedLayer.type === 'text' && (
                        <TextLayerEditor layer={selectedLayer as TextLayer} onUpdate={(updates) => onUpdateLayer(selectedLayer.id, updates)} />
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default SettingsPanel;