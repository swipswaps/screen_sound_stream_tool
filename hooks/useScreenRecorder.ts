
import { useState, useRef, useCallback } from 'react';
import { RecordingStatus } from '../types';

export const useScreenRecorder = () => {
    const [status, setStatus] = useState<RecordingStatus>(RecordingStatus.Idle);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        setStatus(RecordingStatus.Idle);
        setVideoUrl(null);
        setError(null);
        setStream(null);
        recordedChunksRef.current = [];

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' } as any,
                audio: true, // Attempt to capture system/tab audio
            });

            let audioStream: MediaStream | null = null;
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100,
                    },
                });
            } catch (micError) {
                console.warn("Could not get microphone audio stream.", micError);
            }

            const videoTrack = displayStream.getVideoTracks()[0];
            const audioTracks = [
                ...(displayStream.getAudioTracks()),
                ...(audioStream ? audioStream.getAudioTracks() : []),
            ];

            if (audioTracks.length === 0) {
                console.warn("No audio tracks available. Recording will be video-only.");
            }
            
            setStatus(RecordingStatus.Recording);
            
            const combinedStream = new MediaStream([videoTrack, ...audioTracks]);
            setStream(combinedStream);

            videoTrack.onended = () => {
                // User clicked "Stop sharing" in browser UI
                stopRecording();
            };

            mediaRecorderRef.current = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm; codecs=vp8,opus'
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
                setStatus(RecordingStatus.Stopped);
                setStream(null);
                combinedStream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();

        } catch (err) {
            console.error("Error starting recording:", err);
            let message = 'An unknown error occurred.';
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    message = 'Permission to access screen or microphone was denied. Please allow access and try again.';
                } else {
                    message = err.message;
                }
            }
            setError(message);
            setStatus(RecordingStatus.Error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && status === RecordingStatus.Recording) {
            mediaRecorderRef.current.stop();
        }
    }, [status]);

    const downloadRecording = useCallback(() => {
        if (videoUrl) {
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = `recording-${new Date().toISOString()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }, [videoUrl]);

    const reset = useCallback(() => {
        setVideoUrl(null);
        setStatus(RecordingStatus.Idle);
        setError(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        recordedChunksRef.current = [];
    }, [stream]);

    return {
        status,
        videoUrl,
        error,
        stream,
        startRecording,
        stopRecording,
        downloadRecording,
        reset,
    };
};
