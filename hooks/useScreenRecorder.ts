import { useState, useRef, useCallback } from 'react';
import { AppStatus } from '../types';

const WEBSOCKET_URL = 'ws://localhost:8080';

export const useScreenRecorder = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.Idle);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const recordedChunks = useRef<Blob[]>([]);

    const cleanup = useCallback(() => {
        stream?.getTracks().forEach(track => track.stop());
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current?.stop();
        }
        if (socketRef.current?.readyState < 2) {
            socketRef.current?.close();
        }
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
        
        setStream(null);
        setVideoUrl(null);
        mediaRecorderRef.current = null;
        socketRef.current = null;
        recordedChunks.current = [];
    }, [stream, videoUrl]);

    const stopAction = useCallback(() => {
        if (mediaRecorderRef.current && (status === AppStatus.Streaming || status === AppStatus.Recording)) {
            mediaRecorderRef.current.stop();
        }
    }, [status]);
    
    const handleStreamEnd = useCallback(() => {
        stopAction();
    }, [stopAction]);

    const initializeMediaStream = useCallback(async (streamSource: 'screen' | 'webcam') => {
        reset(); 

        try {
            let mediaStream: MediaStream;

            if (streamSource === 'screen') {
                 const displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' } as any,
                    audio: true,
                });

                let audioStream: MediaStream | null = null;
                try {
                    audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
                    });
                } catch (micError) {
                    console.warn("Could not get microphone audio stream.", micError);
                }

                const videoTrack = displayStream.getVideoTracks()[0];
                const audioTracks = [
                    ...(displayStream.getAudioTracks()),
                    ...(audioStream ? audioStream.getAudioTracks() : []),
                ];
                
                mediaStream = new MediaStream([videoTrack, ...audioTracks]);
                videoTrack.onended = handleStreamEnd;
            } else { // webcam
                 mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
                });
            }
            
            setStream(mediaStream);
            return mediaStream;
        } catch (err) {
            console.error("Error getting media stream:", err);
            let message = 'An unknown error occurred while accessing media devices.';
             if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    message = 'Permission to access screen or microphone was denied. Please allow access and try again.';
                } else {
                    message = err.message;
                }
            }
            setError(message);
            setStatus(AppStatus.Error);
            return null;
        }
    }, [handleStreamEnd]);
    
    const createMediaRecorder = (stream: MediaStream, onDataAvailable: (event: BlobEvent) => void, onStop: () => void) => {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8,opus' });
        recorder.ondataavailable = onDataAvailable;
        recorder.onstop = onStop;
        mediaRecorderRef.current = recorder;
        return recorder;
    };

    const startScreenRecording = useCallback(async () => {
        const combinedStream = await initializeMediaStream('screen');
        if (!combinedStream) return;

        setStatus(AppStatus.Recording);
        recordedChunks.current = [];

        const recorder = createMediaRecorder(
            combinedStream,
            (event) => {
                if (event.data.size > 0) recordedChunks.current.push(event.data);
            },
            () => {
                const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
                setStatus(AppStatus.Stopped);
            }
        );
        recorder.start();
    }, [initializeMediaStream]);
    
    const startWebcamRecording = useCallback(async () => {
        const webcamStream = await initializeMediaStream('webcam');
        if (!webcamStream) return;

        setStatus(AppStatus.Recording);
        recordedChunks.current = [];

        const recorder = createMediaRecorder(
            webcamStream,
            (event) => {
                if (event.data.size > 0) recordedChunks.current.push(event.data);
            },
            () => {
                const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
                setStatus(AppStatus.Stopped);
            }
        );
        recorder.start();
    }, [initializeMediaStream]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && status === AppStatus.Recording) {
            mediaRecorderRef.current.stop();
        }
    }, [status]);


    const startStreaming = useCallback(async () => {
        const combinedStream = await initializeMediaStream('screen');
        if (!combinedStream) return;

        socketRef.current = new WebSocket(WEBSOCKET_URL);

        socketRef.current.onopen = () => {
            console.log("WebSocket connection opened.");
            setStatus(AppStatus.Streaming);

            const recorder = createMediaRecorder(
                combinedStream,
                (event) => {
                    if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(event.data);
                    }
                },
                () => {
                    cleanup();
                    setStatus(AppStatus.Idle);
                }
            );
            recorder.start(1000); // Send data every 1 second
        };

        socketRef.current.onerror = (event) => {
            console.error("WebSocket error:", event);
            setError("Failed to connect to streaming server. Ensure the server is running.");
            setStatus(AppStatus.Error);
            cleanup();
        };
        
        socketRef.current.onclose = () => {
            if (status === AppStatus.Streaming) {
                stopStreaming();
            }
        };
    }, [initializeMediaStream, cleanup, status]);

    const stopStreaming = useCallback(() => {
        if (mediaRecorderRef.current && status === AppStatus.Streaming) {
            mediaRecorderRef.current.stop();
        } else {
            cleanup();
            setStatus(AppStatus.Idle);
        }
    }, [status, cleanup]);
    
    const sendMessage = useCallback((message: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(message);
        } else {
            console.warn("Cannot send message, WebSocket is not open.");
        }
    }, []);

    const reset = useCallback(() => {
        cleanup();
        setStatus(AppStatus.Idle);
        setError(null);
    }, [cleanup]);

    return {
        status, error, stream, videoUrl,
        startScreenRecording,
        startWebcamRecording,
        stopRecording,
        startStreaming, stopStreaming,
        reset, sendMessage,
    };
};