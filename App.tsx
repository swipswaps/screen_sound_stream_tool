import React from 'react';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import Toolbar from './components/Toolbar';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  const {
    status,
    canvasRef,
    error,
    layers,
    selectedLayerId,
    setSelectedLayerId,
    startScreenLayer,
    startWebcamLayer,
    startRecording,
    stopSession,
    addMediaOverlay,
    addGraphicOverlay,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    cursorStyle,
    updateLayer,
    removeLayer,
    moveLayer,
  } = useScreenRecorder();

  const isSessionActive = status === 'session' || status === 'recording';

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans select-none">
      <main className="flex-grow flex items-stretch p-8 space-x-8 overflow-hidden">
        <div className="flex-grow flex items-center justify-center bg-black rounded-lg shadow-inner overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <h2 className="text-3xl font-bold mt-4 text-gray-500">Stream Studio</h2>
              <p className="text-gray-600 mt-2">Use the toolbar below to start your session.</p>
            </div>
          )}
        </div>
        {isSessionActive && (
          <SettingsPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
            onRemoveLayer={removeLayer}
            onMoveLayer={moveLayer}
          />
        )}
      </main>
      <Toolbar
        status={status}
        onScreen={startScreenLayer}
        onWebcam={startWebcamLayer}
        onRecord={startRecording}
        onStop={stopSession}
        onMedia={addMediaOverlay}
        onGraphic={addGraphicOverlay}
      />
       {error && <p className="text-red-500 text-center p-2 fixed bottom-24 w-full">{error.message}</p>}
    </div>
  );
};

export default App;
