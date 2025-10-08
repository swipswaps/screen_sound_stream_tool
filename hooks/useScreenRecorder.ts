import { useState, useRef, useCallback, RefObject, useEffect } from 'react';
import { AppStatus, CanvasLayer, VideoLayer } from '../types';

const WEBSOCKET_URL = 'ws://localhost:8080';

export const useScreenRecorder = (canvasRef: RefObject<HTMLCanvasElement>) => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.Idle);
    const [error, setError] = useState<string | null>(null);
    const [layers, setLayers] = useState<CanvasLayer[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const recordedChunks = useRef<Blob[]>([]);
    const animationFrameId = useRef<number>(0);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const primaryVideoLayerId = useRef<string | null>(null);


    const renderCanvas = useCallback(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas resolution based on primary video source if available
        const primaryLayer = layers.find(l => l.id === primaryVideoLayerId.current) as VideoLayer | undefined;
        if (primaryLayer) {
            if(canvas.width !== primaryLayer.mediaElement.videoWidth) {
                canvas.width = primaryLayer.mediaElement.videoWidth;
            }
            if(canvas.height !== primaryLayer.mediaElement.videoHeight) {
                canvas.height = primaryLayer.mediaElement.videoHeight;
            }
        } else {
             // Default size or clear if no primary
            if (canvas.width !== 1280) canvas.width = 1280;
            if (canvas.height !== 720) canvas.height = 720;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111';
        ctx.fillRect(0,0, canvas.width, canvas.height);


        layers.forEach(layer => {
            if (layer.type === 'video') {
                ctx.drawImage(layer.mediaElement, layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'image') {
                ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
            } else if (layer.type === 'text') {
                ctx.font = layer.font;
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, layer.x, layer.y, layer.maxWidth);
            }
        });

        animationFrameId.current = requestAnimationFrame(renderCanvas);
    }, [layers, canvasRef]);
    
    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
        return () => {
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [renderCanvas]);

    const stopSession = useCallback(() => {
        // Stop all video elements and their tracks
        layers.forEach(layer => {
            if (layer.type === 'video') {
                layer.mediaElement.pause();
                layer.mediaElement.srcObject = null;
                (layer.mediaElement.srcObject as MediaStream)?.getTracks().forEach(track => track.stop());
            }
        });
        audioStreamRef.current?.getTracks().forEach(track => track.stop());

        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current?.stop();
        }
        if (socketRef.current?.readyState < 2) {
            socketRef.current?.close();
        }
        
        cancelAnimationFrame(animationFrameId.current);

        // Reset state
        setLayers([]);
        primaryVideoLayerId.current = null;
        mediaRecorderRef.current = null;
        socketRef.current = null;
        recordedChunks.current = [];
        audioStreamRef.current = null;
        setStatus(AppStatus.Idle);
        setError(null);
    }, [layers]);

    const addVideoLayer = async (stream: MediaStream, isPrimary = false) => {
         const videoElement = document.createElement('video');
         videoElement.srcObject = stream;
         videoElement.muted = true;
         videoElement.play().catch(console.error);
         
         await new Promise(resolve => videoElement.onloadedmetadata = resolve);

        const newLayer: VideoLayer = {
            id: stream.id,
            type: 'video',
            x: isPrimary ? 0 : 20,
            y: isPrimary ? 0 : 20,
            width: isPrimary ? stream.getVideoTracks()[0].getSettings().width! : 320,
            height: isPrimary ? stream.getVideoTracks()[0].getSettings().height! : 180,
            mediaElement: videoElement
        };

        if (isPrimary) {
            primaryVideoLayerId.current = newLayer.id;
            audioStreamRef.current = new MediaStream(stream.getAudioTracks());
        }

         setLayers(prev => [...prev, newLayer]);
         setStatus(AppStatus.Ready);
    };

    const startScreenShare = async () => {
        if (status !== AppStatus.Idle && status !== AppStatus.Error) return;
        stopSession();
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' } as any,
                audio: true
            });
            stream.getVideoTracks()[0].onended = stopSession;
            await addVideoLayer(stream, true);
        } catch (err) {
             setError(err instanceof Error && err.name === 'NotAllowedError' ? 'Permission denied.' : 'Could not start screen share.');
             setStatus(AppStatus.Error);
        }
    };
    
    const startWebcam = async () => {
         try {
            const isPrimary = layers.length === 0;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: isPrimary // Only capture audio if it's the first source
            });
            await addVideoLayer(stream, isPrimary);
        } catch (err) {
             setError(err instanceof Error && err.name === 'NotAllowedError' ? 'Permission denied.' : 'Could not start webcam.');
             setStatus(AppStatus.Error);
        }
    };

    const addMediaOverlay = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const imageBitmap = await createImageBitmap(file);
                const newLayer: CanvasLayer = {
                    id: `image-${Date.now()}`,
                    type: 'image',
                    x: 50,
                    y: 50,
                    width: 200,
                    height: (200 / imageBitmap.width) * imageBitmap.height,
                    image: imageBitmap,
                };
                setLayers(prev => [...prev, newLayer]);
            }
        };
        input.click();
    };

    const addGraphicOverlay = () => {
        const text = prompt("Enter text for the overlay:");
        if (text) {
            const newLayer: CanvasLayer = {
                id: `text-${Date.now()}`,
                type: 'text',
                x: 50,
                y: 100,
                text: text,
                font: 'bold 48px Arial',
                color: 'white',
                maxWidth: canvasRef.current!.width - 100,
            };
            setLayers(prev => [...prev, newLayer]);
        }
    };
    
    const beginCapture = (isStreaming: boolean) => {
        if (!canvasRef.current || !audioStreamRef.current) return;
        const canvasStream = canvasRef.current.captureStream(30);
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioStreamRef.current.getAudioTracks()
        ]);

        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp8,opus', videoBitsPerSecond: 2500000 });
        mediaRecorderRef.current = recorder;

        if (isStreaming) {
            socketRef.current = new WebSocket(WEBSOCKET_URL);
            socketRef.current.onopen = () => {
                setStatus(AppStatus.Streaming);
                 recorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(event.data);
                    }
                };
                recorder.start(1000); // Send data every second
            };
            socketRef.current.onerror = () => {
                setError("Failed to connect to streaming server.");
                setStatus(AppStatus.Error);
                stopSession();
            };
        } else {
             setStatus(AppStatus.Recording);
             recordedChunks.current = [];
             recorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.current.push(event.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stream-studio-recording-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                stopSession();
            };
            recorder.start();
        }
    };

    const startRecording = () => beginCapture(false);
    const startStreaming = () => beginCapture(true);


    return {
        status, error,
        startScreenShare, startWebcam,
        startRecording, startStreaming,
        stopSession, addMediaOverlay, addGraphicOverlay,
    };
};
