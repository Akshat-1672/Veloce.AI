import React, { useState, useRef } from 'react';
import { Film, UploadCloud, Play, Video, Scale, Network, Database, Scissors } from 'lucide-react';
import { TelemetryCard } from './TelemetryCard.tsx';
import { ResultsPanel } from './ResultsPanel.tsx';
import type { TelemetryState, ProcessPayload, SSEMessage, IntegrationsState } from '../types.ts';
import { processVideo } from '../services/api.ts';

interface WorkspaceProps {
  mockMode: boolean;
  integrations: IntegrationsState;
  onOpenIntegrations: () => void;
}

const INITIAL_TELEMETRY: TelemetryState = {
  director: 'dormant',
  compliance: 'dormant',
  composer: 'dormant',
  dispatcher: 'dormant',
  system: 'dormant',
  messages: {
    director: '💤 Dormant',
    compliance: '💤 Dormant',
    composer: '💤 Dormant',
    dispatcher: '💤 Dormant',
  }
};

export const Workspace: React.FC<WorkspaceProps> = ({ mockMode, integrations, onOpenIntegrations }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState>(INITIAL_TELEMETRY);
  const [results, setResults] = useState<ProcessPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setTelemetry(INITIAL_TELEMETRY);
      setResults(null);
    }
  };

  const handleLaunch = async () => {
    if (!videoFile && !mockMode) return;
    
    setIsProcessing(true);
    setTelemetry(INITIAL_TELEMETRY);
    setResults(null);

    const fileToProcess = videoFile || new File(["mock"], "mock_video.mp4", { type: "video/mp4" });

    await processVideo(fileToProcess, mockMode, (msg: SSEMessage) => {
      setTelemetry(prev => {
        const newState = { ...prev };
        
        if (msg.agent === 'Director') {
          newState.director = msg.status as any;
          if (msg.message) newState.messages.director = msg.message;
        } else if (msg.agent === 'Compliance') {
          newState.compliance = msg.status as any;
          if (msg.message) newState.messages.compliance = msg.message;
        } else if (msg.agent === 'Video Composer') {
          newState.composer = msg.status as any;
          if (msg.message) newState.messages.composer = msg.message;
        } else if (msg.agent === 'Workspace Dispatcher') {
          newState.dispatcher = msg.status as any;
          if (msg.message) newState.messages.dispatcher = msg.message;
        } else if (msg.agent === 'System') {
          newState.system = msg.status as any;
          if (msg.status === 'finished' && msg.payload) {
            setResults(msg.payload);
            setIsProcessing(false);
          } else if (msg.status === 'error') {
            setIsProcessing(false);
            alert(`Pipeline Error: ${msg.message}`);
          }
        }
        
        return newState;
      });
    });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 rounded-xl">
              <Film className="w-8 h-8 text-blue-500" />
            </div>
            Veloce.AI: Multi-Agent Video Content Lifecycle Engine
          </h2>
          <p className="text-gray-400 text-lg italic ml-14">
            Autonomous post-production, multi-agent compliance audits, and workspace automation loops powered by Gemini.
          </p>
        </div>

        {/* Upload & Action Area */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".mp4,.wav,.mp3"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="media-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="media-upload"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all ${
                    isProcessing 
                      ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-50' 
                      : 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 cursor-pointer group'
                  }`}
                >
                  <UploadCloud className={`w-10 h-10 mb-3 ${isProcessing ? 'text-gray-600' : 'text-gray-400 group-hover:text-blue-400 transition-colors'}`} />
                  <span className="text-base font-medium text-gray-300">
                    {videoFile ? videoFile.name : 'Drag & Drop Media File (.mp4, .wav, .mp3)'}
                  </span>
                  {!videoFile && <span className="text-sm text-gray-500 mt-1">or click to browse</span>}
                </label>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <button
                onClick={handleLaunch}
                disabled={isProcessing || (!videoFile && !mockMode)}
                className="w-full py-5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:shadow-none flex items-center justify-center gap-3 group"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                    Launch Engine Lifecycle Loop
                  </>
                )}
              </button>
              {mockMode && !videoFile && (
                <p className="text-xs text-orange-400 text-center mt-3">
                  Mock mode active: Launch available without file.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Live Agent Telemetry Tracking Matrix */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
            <Network className="w-5 h-5 text-gray-400" />
            Live Agent Telemetry Tracking Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TelemetryCard 
              title="Director Agent" 
              icon={<Video className="w-5 h-5" />}
              status={telemetry.director}
              message={telemetry.messages.director}
            />
            <TelemetryCard 
              title="Compliance Officer" 
              icon={<Scale className="w-5 h-5" />}
              status={telemetry.compliance}
              message={telemetry.messages.compliance}
            />
            <TelemetryCard 
              title="Video Composer" 
              icon={<Scissors className="w-5 h-5" />}
              status={telemetry.composer}
              message={telemetry.messages.composer}
            />
            <TelemetryCard 
              title="Workspace Dispatcher" 
              icon={<Database className="w-5 h-5" />}
              status={telemetry.dispatcher}
              message={telemetry.messages.dispatcher}
            />
          </div>
        </div>

        {/* Consolidated Deliverables Output Panel */}
        {results && (
          <ResultsPanel 
            payload={results} 
            videoFile={videoFile} 
            integrations={integrations}
            onOpenIntegrations={onOpenIntegrations}
          />
        )}

      </div>
    </div>
  );
};
