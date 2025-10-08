import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingStatus, CanvasLayer, VideoLayer, ImageLayer, TextLayer } from '../types';

type ActionState = {
  action: 'move' | 'resize' | null;
  layerId: string | null;
  handle: 'tl' | 'tr' | 'bl' | 'br' | 'body' | null;
  offsetX: number;
  offsetY: number;
};

const HANDLE_SIZE = 10;

export const useScreenRecorder = () => {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [error, setError] = useState<Error | null>(null);
    const [layers, setLayers] = useState<CanvasLayer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [cursorStyle, setCursorStyle] = useState('default');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number>();
    const actionStateRef = useRef<ActionState>({ action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0 });

    const getMixedAudioStream = useCallback(() => {
        // FIX: Use a cross-browser compatible way to instantiate AudioContext to prevent potential errors on different platforms.
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        
        layers.forEach(layer => {
            if (layer.type === 'video' && layer.stream.getAudioTracks().length > 0) {
                const source = audioContext.createMediaStreamSource(layer.stream);
                source.connect(destination);
            }
        });
        return destination.stream;
    }, [layers]);

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        layers.forEach(layer => {
            if (!layer.visible) return;
            ctx.save();
            if (layer.type === 'video' || layer.type === 'image') {
                ctx.drawImage(layer.element, layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'text') {
                ctx.font = layer.font;
                ctx.fillStyle = layer.color;
                ctx.textBaseline = 'top';
                // Basic text wrapping
                const words = layer.text.split(' ');
                let line = '';
                let textY = layer.y;
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > layer.width && n > 0) {
                        ctx.fillText(line, layer.x, textY);
                        line = words[n] + ' ';
                        textY += parseInt(layer.font, 10) * 1.2;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, layer.x, textY);
            }
            ctx.restore();

            // Draw selection handles if selected
            if (layer.id === selectedLayerId) {
                ctx.strokeStyle = '#4f46e5';
                ctx.lineWidth = 2;
                ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

                // Handles
                ctx.fillStyle = '#4f46e5';
                ctx.fillRect(layer.x - HANDLE_SIZE / 2, layer.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE); // tl
                ctx.fillRect(layer.x + layer.width - HANDLE_SIZE / 2, layer.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE); // tr
                ctx.fillRect(layer.x - HANDLE_SIZE / 2, layer.y + layer.height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE); // bl
                ctx.fillRect(layer.x + layer.width - HANDLE_SIZE / 2, layer.y + layer.height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE); // br
            }
        });

        animationFrameRef.current = requestAnimationFrame(renderCanvas);
    }, [layers, selectedLayerId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Set canvas resolution
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        animationFrameRef.current = requestAnimationFrame(renderCanvas);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [renderCanvas]);

    const stopSession = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        layers.forEach(layer => {
            if (layer.type === 'video') {
                layer.stream.getTracks().forEach(track => track.stop());
            }
        });
        setLayers([]);
        setStatus('idle');
        setSelectedLayerId(null);
    }, [layers]);

    const addLayer = (layer: CanvasLayer) => {
        setLayers(prev => [...prev, layer]);
        setStatus('session');
    };
    
    const startScreenLayer = async () => {
        try {
            // FIX: The 'cursor' property is valid for getDisplayMedia but not in the standard MediaTrackConstraints type. Cast to 'any' to bypass the type error.
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' } as any, audio: true });
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.muted = true;
            videoElement.play();

            const track = stream.getVideoTracks()[0];
            const { width, height } = track.getSettings();

            addLayer({
                id: `screen-${Date.now()}`, type: 'video', stream, element: videoElement, x: 50, y: 50, width: width ? width / 2 : 640, height: height ? height / 2 : 360, visible: true, sourceType: 'screen'
            });
        } catch (err) {
            setError(new Error('Could not start screen sharing.'));
        }
    };
    
    const startWebcamLayer = async (deviceId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId }, audio: true });
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.muted = true;
            videoElement.play();

            const track = stream.getVideoTracks()[0];
            const { width, height } = track.getSettings();

            addLayer({
                id: `webcam-${Date.now()}`, type: 'video', stream, element: videoElement, x: 100, y: 100, width: width ? width / 4 : 320, height: height ? height / 4 : 180, visible: true, sourceType: 'webcam'
            });
        } catch (err) {
            setError(new Error('Could not start webcam.'));
        }
    };

    const startRecording = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasStream = canvas.captureStream(30);
        const mixedAudioStream = getMixedAudioStream();
        mixedAudioStream.getAudioTracks().forEach(track => {
            canvasStream.addTrack(track);
        });

        mediaRecorderRef.current = new MediaRecorder(canvasStream, { mimeType: 'video/webm;codecs=vp9,opus' });
        recordedChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stream-studio-recording-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            setStatus('session');
        };

        mediaRecorderRef.current.start();
        setStatus('recording');
    };

    const addMediaOverlay = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target?.result as string;
                    img.onload = () => {
                         addLayer({
                            id: `image-${Date.now()}`, type: 'image', element: img, x: 150, y: 150, width: img.width / 2, height: img.height / 2, visible: true,
                        });
                    }
                }
                reader.readAsDataURL(file);
            }
        }
        input.click();
    };

    const addGraphicOverlay = () => {
        const text = prompt("Enter text for the graphic overlay:");
        if (text) {
             addLayer({
                id: `text-${Date.now()}`, type: 'text', text, x: 200, y: 200, width: 300, height: 100, visible: true, font: 'bold 48px Arial', color: 'white',
            });
        }
    };
    
    // FIX: Add an explicit return type to ensure TypeScript correctly infers the 'handle' property as a literal union type, not a generic string.
    const getLayerAndHandleAt = (x: number, y: number): { layer: CanvasLayer | null, handle: ActionState['handle'] } => {
        for (const layer of [...layers].reverse()) {
             if (layer.id === selectedLayerId) {
                // Check handles first
                const hx = layer.x - HANDLE_SIZE / 2;
                const hy = layer.y - HANDLE_SIZE / 2;
                const hx2 = layer.x + layer.width - HANDLE_SIZE / 2;
                const hy2 = layer.y + layer.height - HANDLE_SIZE / 2;
                if (x > hx && x < hx + HANDLE_SIZE && y > hy && y < hy + HANDLE_SIZE) return { layer, handle: 'tl' };
                if (x > hx2 && x < hx2 + HANDLE_SIZE && y > hy && y < hy + HANDLE_SIZE) return { layer, handle: 'tr' };
                if (x > hx && x < hx + HANDLE_SIZE && y > hy2 && y < hy2 + HANDLE_SIZE) return { layer, handle: 'bl' };
                if (x > hx2 && x < hx2 + HANDLE_SIZE && y > hy2 && y < hy2 + HANDLE_SIZE) return { layer, handle: 'br' };
             }
             // Check body
             if (x > layer.x && x < layer.x + layer.width && y > layer.y && y < layer.y + layer.height) {
                 return { layer, handle: 'body' };
             }
        }
        return { layer: null, handle: null };
    }
    
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const { layer, handle } = getLayerAndHandleAt(offsetX, offsetY);
        
        if (layer) {
            setSelectedLayerId(layer.id);
            const action = handle === 'body' ? 'move' : 'resize';
            actionStateRef.current = { action, layerId: layer.id, handle, offsetX: offsetX - layer.x, offsetY: offsetY - layer.y };
        } else {
            setSelectedLayerId(null);
            actionStateRef.current = { action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0 };
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const { action, layerId, handle, offsetX: startOffsetX, offsetY: startOffsetY } = actionStateRef.current;
        
        if (action && layerId) { // We are dragging/resizing
            setLayers(prev => prev.map(l => {
                if (l.id === layerId) {
                    const newLayer = { ...l };
                    if (action === 'move') {
                        newLayer.x = offsetX - startOffsetX;
                        newLayer.y = offsetY - startOffsetY;
                    } else if (action === 'resize') {
                        const right = newLayer.x + newLayer.width;
                        const bottom = newLayer.y + newLayer.height;
                        if (handle === 'tl') { newLayer.width = right - offsetX; newLayer.height = bottom - offsetY; newLayer.x = offsetX; newLayer.y = offsetY; }
                        else if (handle === 'tr') { newLayer.width = offsetX - newLayer.x; newLayer.height = bottom - offsetY; newLayer.y = offsetY; }
                        else if (handle === 'bl') { newLayer.width = right - offsetX; newLayer.height = offsetY - newLayer.y; newLayer.x = offsetX; }
                        else if (handle === 'br') { newLayer.width = offsetX - newLayer.x; newLayer.height = offsetY - newLayer.y; }
                        if (newLayer.width < 20) newLayer.width = 20;
                        if (newLayer.height < 20) newLayer.height = 20;
                    }
                    return newLayer;
                }
                return l;
            }));
        } else { // Just hovering
            const { handle } = getLayerAndHandleAt(offsetX, offsetY);
            if (handle === 'body') setCursorStyle('move');
            else if (handle === 'tl' || handle === 'br') setCursorStyle('nwse-resize');
            else if (handle === 'tr' || handle === 'bl') setCursorStyle('nesw-resize');
            else setCursorStyle('default');
        }
    };

    const handleMouseUp = () => {
        actionStateRef.current = { action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0 };
    };

    const handleMouseLeave = () => {
        actionStateRef.current = { action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0 };
        setCursorStyle('default');
    };

    return {
        status, canvasRef, error, startScreenLayer, startWebcamLayer, startRecording, stopSession, addMediaOverlay, addGraphicOverlay,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, cursorStyle
    };
};