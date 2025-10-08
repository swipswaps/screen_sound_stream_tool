import { useState, useRef, useCallback, useEffect, MouseEvent } from 'react';
import { RecordingStatus, CanvasLayer, VideoLayer, TextLayer, ImageLayer } from '../types';

type ActionState = {
  action: 'move' | 'resize' | null;
  layerId: string | null;
  handle: 'tl' | 'tr' | 'bl' | 'br' | 'body' | null;
  offsetX: number;
  offsetY: number;
  aspectRatio: number;
};

const HANDLE_SIZE = 10;

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

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
    const actionStateRef = useRef<ActionState>({ action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0, aspectRatio: 0 });
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const getMixedAudioStream = useCallback(() => {
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

        // Render layers in order
        layers.forEach(layer => {
            if (!layer.visible) return;
            ctx.save();
            ctx.globalAlpha = layer.opacity;

            // Handle Rounded Corners and Clipping for Video/Image
            if ((layer.type === 'video' || layer.type === 'image') && layer.cornerRadius && layer.cornerRadius > 0) {
                 const cornerRadius = Math.min(layer.cornerRadius, layer.width / 2, layer.height / 2);
                 ctx.beginPath();
                 ctx.moveTo(layer.x + cornerRadius, layer.y);
                 ctx.arcTo(layer.x + layer.width, layer.y, layer.x + layer.width, layer.y + layer.height, cornerRadius);
                 ctx.arcTo(layer.x + layer.width, layer.y + layer.height, layer.x, layer.y + layer.height, cornerRadius);
                 ctx.arcTo(layer.x, layer.y + layer.height, layer.x, layer.y, cornerRadius);
                 ctx.arcTo(layer.x, layer.y, layer.x + layer.width, layer.y, cornerRadius);
                 ctx.closePath();
                 ctx.clip();
            }

            if (layer.type === 'video' && layer.sourceType === 'webcam' && layer.chromaKeyEnabled && layer.chromaKeyColor) {
                 if (!offscreenCanvasRef.current) {
                    offscreenCanvasRef.current = document.createElement('canvas');
                }
                const offscreenCanvas = offscreenCanvasRef.current;
                const offscreenCtx = offscreenCanvas.getContext('2d');

                if (offscreenCtx) {
                    if (offscreenCanvas.width !== layer.element.videoWidth || offscreenCanvas.height !== layer.element.videoHeight) {
                        offscreenCanvas.width = layer.element.videoWidth;
                        offscreenCanvas.height = layer.element.videoHeight;
                    }
                    
                    offscreenCtx.drawImage(layer.element, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
                    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                    const data = imageData.data;
                    const keyRgb = hexToRgb(layer.chromaKeyColor);

                    const similarity = (layer.chromaKeySimilarity ?? 0) * 255 * 1.5;
                    const smoothness = (layer.chromaKeySmoothness ?? 0) * 255;

                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const distance = Math.sqrt(Math.pow(r - keyRgb.r, 2) + Math.pow(g - keyRgb.g, 2) + Math.pow(b - keyRgb.b, 2));
                        
                        if (distance < similarity) {
                            data[i + 3] = 0;
                        } else if (distance < similarity + smoothness) {
                            const alpha = (distance - similarity) / smoothness;
                            data[i + 3] *= alpha;
                        }
                    }
                    offscreenCtx.putImageData(imageData, 0, 0);
                    ctx.drawImage(offscreenCanvas, layer.x, layer.y, layer.width, layer.height);
                }
            } else if (layer.type === 'video' || layer.type === 'image') {
                ctx.drawImage(layer.element, layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'text') {
                // Background
                if (layer.backgroundColor && layer.backgroundColor !== '#000000' && layer.backgroundColor !== 'transparent') {
                    ctx.fillStyle = layer.backgroundColor;
                    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
                }

                ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
                ctx.fillStyle = layer.color;
                
                // Text wrapping and alignment logic
                const padding = layer.padding ?? 0;
                const contentWidth = layer.width - padding * 2;
                
                const words = layer.text.split(' ');
                let line = '';
                const lines: string[] = [];
                for (const word of words) {
                    const testLine = line ? `${line} ${word}` : word;
                    if (ctx.measureText(testLine).width > contentWidth && line) {
                        lines.push(line);
                        line = word;
                    } else {
                        line = testLine;
                    }
                }
                if (line) lines.push(line);

                const lineHeight = layer.fontSize * 1.2;
                const totalTextHeight = (lines.length * lineHeight) - (lineHeight - layer.fontSize);

                let startY: number;
                if (layer.verticalAlign === 'middle') {
                    startY = layer.y + (layer.height - totalTextHeight) / 2;
                } else if (layer.verticalAlign === 'bottom') {
                    startY = layer.y + layer.height - totalTextHeight - padding;
                } else { // top
                    startY = layer.y + padding;
                }

                ctx.textBaseline = 'top';
                ctx.textAlign = layer.textAlign ?? 'left';

                lines.forEach((line, index) => {
                    let textX: number;
                     if (layer.textAlign === 'center') {
                        textX = layer.x + layer.width / 2;
                    } else if (layer.textAlign === 'right') {
                        textX = layer.x + layer.width - padding;
                    } else { // left
                        textX = layer.x + padding;
                    }
                    ctx.fillText(line, textX, startY + (index * lineHeight));
                });
            }
            ctx.restore(); // This restore is important to remove clipping for the next layer

            // Handle borders for Video/Image (drawn on top)
            if ((layer.type === 'video' || layer.type === 'image') && layer.borderWidth && layer.borderWidth > 0) {
                const borderWidth = layer.borderWidth;
                const cornerRadius = Math.min(layer.cornerRadius ?? 0, (layer.width - borderWidth) / 2, (layer.height - borderWidth) / 2);

                ctx.save();
                ctx.lineWidth = borderWidth;
                ctx.strokeStyle = layer.borderColor ?? '#000000';
                
                const x = layer.x + borderWidth / 2;
                const y = layer.y + borderWidth / 2;
                const w = layer.width - borderWidth;
                const h = layer.height - borderWidth;
                
                ctx.beginPath();
                ctx.moveTo(x + cornerRadius, y);
                ctx.arcTo(x + w, y, x + w, y + h, cornerRadius);
                ctx.arcTo(x + w, y + h, x, y + h, cornerRadius);
                ctx.arcTo(x, y + h, x, y, cornerRadius);
                ctx.arcTo(x, y, x + w, y, cornerRadius);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }


            if (layer.id === selectedLayerId) {
                ctx.strokeStyle = '#4f46e5';
                ctx.lineWidth = 2;
                ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

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
        const resizeCanvas = () => {
             if (canvas && canvas.parentElement) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animationFrameRef.current = requestAnimationFrame(renderCanvas);
        return () => {
            window.removeEventListener('resize', resizeCanvas);
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
        setSelectedLayerId(layer.id);
        if(status === 'idle') setStatus('session');
    };

    const updateLayer = (layerId: string, updates: Partial<CanvasLayer>) => {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, ...updates } : l));
    };

    const removeLayer = (layerId: string) => {
        setLayers(prev => {
            const newLayers = prev.filter(l => l.id !== layerId);
            if (newLayers.length === 0) {
                stopSession();
            }
            return newLayers;
        });
        if (selectedLayerId === layerId) {
            setSelectedLayerId(null);
        }
    };

    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === layerId);
            if (index === -1) return prev;
            
            const newLayers = [...prev];
            const [layer] = newLayers.splice(index, 1);
            
            if (direction === 'up') {
                const newIndex = Math.min(index + 1, newLayers.length);
                newLayers.splice(newIndex, 0, layer);
            } else {
                const newIndex = Math.max(index - 1, 0);
                newLayers.splice(newIndex, 0, layer);
            }
            return newLayers;
        });
    };
    
    const startScreenLayer = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' } as any, audio: true });
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.muted = true;
            videoElement.play();

            const track = stream.getVideoTracks()[0];
            const { width, height } = track.getSettings();

            const newLayer: VideoLayer = {
                id: `screen-${Date.now()}`, type: 'video', stream, element: videoElement, x: 50, y: 50, width: width ? width / 2 : 640, height: height ? height / 2 : 360, visible: true, sourceType: 'screen', opacity: 1,
                cornerRadius: 0,
                borderWidth: 0,
                borderColor: '#000000',
            };
            addLayer(newLayer);
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

            const newLayer: VideoLayer = {
                id: `webcam-${Date.now()}`, type: 'video', stream, element: videoElement, x: 100, y: 100, width: width ? width / 4 : 320, height: height ? height / 4 : 180, visible: true, sourceType: 'webcam', opacity: 1,
                chromaKeyEnabled: false,
                chromaKeyColor: '#00ff00',
                chromaKeySimilarity: 0.2,
                chromaKeySmoothness: 0.05,
                cornerRadius: 0,
                borderWidth: 0,
                borderColor: '#000000',
            };
            addLayer(newLayer);
        } catch (err) {
            setError(new Error('Could not start webcam.'));
        }
    };

    const startRecording = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const MimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
        ];

        const supportedMimeType = MimeTypes.find(type => MediaRecorder.isTypeSupported(type));

        if (!supportedMimeType) {
            setError(new Error('Your browser does not support any available video recording formats.'));
            console.error('No supported mime type found for MediaRecorder');
            return;
        }

        const canvasStream = canvas.captureStream(30);
        const mixedAudioStream = getMixedAudioStream();
        mixedAudioStream.getAudioTracks().forEach(track => {
            canvasStream.addTrack(track);
        });

        mediaRecorderRef.current = new MediaRecorder(canvasStream, { mimeType: supportedMimeType });
        recordedChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: supportedMimeType });
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
                        const newLayer: ImageLayer = {
                            id: `image-${Date.now()}`, type: 'image', element: img, x: 150, y: 150, width: img.width / 2, height: img.height / 2, visible: true, opacity: 1,
                            cornerRadius: 0,
                            borderWidth: 0,
                            borderColor: '#000000',
                        };
                         addLayer(newLayer);
                    }
                }
                reader.readAsDataURL(file);
            }
        }
        input.click();
    };

    const addGraphicOverlay = () => {
        const newLayer: TextLayer = {
            id: `text-${Date.now()}`, type: 'text', text: 'Your Text Here', x: 200, y: 200, width: 300, height: 100, visible: true, 
            fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', color: '#FFFFFF', opacity: 1,
            textAlign: 'left',
            verticalAlign: 'top',
            backgroundColor: 'transparent',
            padding: 10,
        };
        addLayer(newLayer);
    };
    
    const getLayerAndHandleAt = (x: number, y: number): { layer: CanvasLayer | null, handle: ActionState['handle'] } => {
        for (const layer of [...layers].reverse()) {
             if (layer.id === selectedLayerId) {
                const hx = layer.x - HANDLE_SIZE / 2;
                const hy = layer.y - HANDLE_SIZE / 2;
                const hx2 = layer.x + layer.width - HANDLE_SIZE / 2;
                const hy2 = layer.y + layer.height - HANDLE_SIZE / 2;
                if (x > hx && x < hx + HANDLE_SIZE && y > hy && y < hy + HANDLE_SIZE) return { layer, handle: 'tl' };
                if (x > hx2 && x < hx2 + HANDLE_SIZE && y > hy && y < hy + HANDLE_SIZE) return { layer, handle: 'tr' };
                if (x > hx && x < hx + HANDLE_SIZE && y > hy2 && y < hy2 + HANDLE_SIZE) return { layer, handle: 'bl' };
                if (x > hx2 && x < hx2 + HANDLE_SIZE && y > hy2 && y < hy2 + HANDLE_SIZE) return { layer, handle: 'br' };
             }
             if (x > layer.x && x < layer.x + layer.width && y > layer.y && y < layer.y + layer.height) {
                 return { layer, handle: 'body' };
             }
        }
        return { layer: null, handle: null };
    }
    
    // FIX: Use `MouseEvent` from react instead of `React.MouseEvent`
    const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const { layer, handle } = getLayerAndHandleAt(offsetX, offsetY);
        
        if (layer) {
            setSelectedLayerId(layer.id);
            const action = handle === 'body' ? 'move' : 'resize';
            const aspectRatio = (layer.type === 'image' || layer.type === 'video') ? layer.width / layer.height : 0;
            actionStateRef.current = { action, layerId: layer.id, handle, offsetX: offsetX - layer.x, offsetY: offsetY - layer.y, aspectRatio };
        } else {
            setSelectedLayerId(null);
            actionStateRef.current = { action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0, aspectRatio: 0 };
        }
    };
    
    // FIX: Use `MouseEvent` from react instead of `React.MouseEvent`
    const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const { action, layerId, handle, offsetX: startOffsetX, offsetY: startOffsetY } = actionStateRef.current;
        
        if (action && layerId) {
            setLayers(prev => prev.map(l => {
                if (l.id === layerId) {
                    const newLayer = { ...l };
                    if (action === 'move') {
                        newLayer.x = offsetX - startOffsetX;
                        newLayer.y = offsetY - startOffsetY;
                    } else if (action === 'resize') {
                        const { aspectRatio } = actionStateRef.current;
                        const right = newLayer.x + newLayer.width;
                        const bottom = newLayer.y + newLayer.height;

                        if (aspectRatio > 0 && handle !== 'body') {
                           let newWidth = newLayer.width;
                           let newHeight = newLayer.height;
                           if (handle === 'br') {
                                newWidth = offsetX - newLayer.x;
                                newHeight = newWidth / aspectRatio;
                           } else if (handle === 'bl') {
                                newWidth = right - offsetX;
                                newHeight = newWidth / aspectRatio;
                                newLayer.x = offsetX;
                           } else if (handle === 'tr') {
                                newWidth = offsetX - newLayer.x;
                                newHeight = newWidth / aspectRatio;
                                newLayer.y = bottom - newHeight;
                           } else if (handle === 'tl') {
                                newWidth = right - offsetX;
                                newHeight = newWidth / aspectRatio;
                                newLayer.x = offsetX;
                                newLayer.y = bottom - newHeight;
                           }
                           
                           if (newWidth >= 20 && newHeight >= 20) {
                                newLayer.width = newWidth;
                                newLayer.height = newHeight;
                           }
                        } else {
                            if (handle === 'tl') { newLayer.width = right - offsetX; newLayer.height = bottom - offsetY; newLayer.x = offsetX; newLayer.y = offsetY; }
                            else if (handle === 'tr') { newLayer.width = offsetX - newLayer.x; newLayer.height = bottom - offsetY; newLayer.y = offsetY; }
                            else if (handle === 'bl') { newLayer.width = right - offsetX; newLayer.height = offsetY - newLayer.y; newLayer.x = offsetX; }
                            else if (handle === 'br') { newLayer.width = offsetX - newLayer.x; newLayer.height = offsetY - newLayer.y; }
                        }
                        
                        if (newLayer.width < 20) newLayer.width = 20;
                        if (newLayer.height < 20) newLayer.height = 20;
                    }
                    return newLayer;
                }
                return l;
            }));
        } else {
            const { handle } = getLayerAndHandleAt(offsetX, offsetY);
            if (handle === 'body') setCursorStyle('move');
            else if (handle === 'tl' || handle === 'br') setCursorStyle('nwse-resize');
            else if (handle === 'tr' || handle === 'bl') setCursorStyle('nesw-resize');
            else setCursorStyle('default');
        }
    };

    const handleMouseUp = () => {
        actionStateRef.current = { action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0, aspectRatio: 0 };
    };

    const handleMouseLeave = () => {
        actionStateRef.current = { action: null, layerId: null, handle: null, offsetX: 0, offsetY: 0, aspectRatio: 0 };
        setCursorStyle('default');
    };

    return {
        status, canvasRef, error, layers, selectedLayerId, setSelectedLayerId, startScreenLayer, startWebcamLayer, startRecording, stopSession, addMediaOverlay, addGraphicOverlay,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, cursorStyle,
        updateLayer, removeLayer, moveLayer
    };
};