import React, { useState, useRef } from 'react';
import { Film, UploadCloud, Play, Video, Scale, Network, Database, Scissors, AlertCircle, Link } from 'lucide-react';
import { TelemetryCard } from './TelemetryCard.tsx';
import { ResultsPanel } from './ResultsPanel.tsx';
import type { TelemetryState, ProcessPayload, SSEMessage, IntegrationsState } from '../types.ts';
import { processVideo } from '../api/client.ts';

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
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState>(INITIAL_TELEMETRY);
  const [results, setResults] = useState<ProcessPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 14 * 1024 * 1024) {
        setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 14MB limit for frontend-only Vertex AI processing. Please select a smaller file or enable Mock Mode.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setVideoFile(file);
      setTelemetry(INITIAL_TELEMETRY);
      setResults(null);
      setErrorMsg(null);
    }
  };

  const handleLaunch = async () => {
    if (!mockMode && uploadMode === 'file' && !videoFile) return;
    if (!mockMode && uploadMode === 'url' && !videoUrl.trim()) return;
    
    setIsProcessing(true);
    setTelemetry(INITIAL_TELEMETRY);
    setResults(null);
    setErrorMsg(null);

    let fileToProcess: File | null = videoFile;

    if (uploadMode === 'url' && videoUrl.trim()) {
      if (mockMode) {
        fileToProcess = new File(["mock"], "mock_video_from_url.mp4", { type: "video/mp4" });
      } else {
        setIsFetchingUrl(true);
        try {
          const response = await fetch(videoUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          fileToProcess = new File([blob], "fetched_video.mp4", { type: blob.type || 'video/mp4' });
          
          if (fileToProcess.size > 14 * 1024 * 1024) {
            throw new Error(`Fetched file size (${(fileToProcess.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 14MB limit.`);
          }
        } catch (err) {
          setErrorMsg(`Failed to fetch video from URL. Ensure the link is a direct video file and allows cross-origin requests (CORS). Error: ${(err as Error).message}`);
          setIsFetchingUrl(false);
          setIsProcessing(false);
          return;
        }
        setIsFetchingUrl(false);
      }
    }

    if (!fileToProcess) {
      fileToProcess = new File(["mock"], "mock_video.mp4", { type: "video/mp4" });
    }

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
            setErrorMsg(msg.message || 'An unknown error occurred during processing.');
          }
        }
        
        return newState;
      });
    });
  };

  const isLaunchDisabled = isProcessing || isFetchingUrl || (!mockMode && (
    (uploadMode === 'file' && !videoFile) || 
    (uploadMode === 'url' && !videoUrl.trim())
  ));

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
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

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 flex flex-col h-full">
              
              <div className="flex gap-6 mb-4 border-b border-gray-800">
                <button 
                  onClick={() => setUploadMode('file')} 
                  className={`pb-3 text-sm font-medium transition-colors relative ${uploadMode === 'file' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  File Upload
                  {uploadMode === 'file' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
                </button>
                <button 
                  onClick={() => setUploadMode('url')} 
                  className={`pb-3 text-sm font-medium transition-colors relative ${uploadMode === 'url' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Video URL
                  {uploadMode === 'url' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {uploadMode === 'file' ? (
                  <div className="relative h-full min-h-[160px]">
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
                      className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-xl transition-all ${
                        isProcessing 
                          ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-50' 
                          : 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 cursor-pointer group'
                      }`}
                    >
                      <UploadCloud className={`w-10 h-10 mb-3 ${isProcessing ? 'text-gray-600' : 'text-gray-400 group-hover:text-blue-400 transition-colors'}`} />
                      <span className="text-base font-medium text-gray-300">
                        {videoFile ? videoFile.name : 'Drag & Drop Media File (.mp4, .wav, .mp3)'}
                      </span>
                      {!videoFile && <span className="text-sm text-gray-500 mt-1">Max size: 14MB (Frontend Limit)</span>}
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center h-full min-h-[160px] space-y-3">
                    <label className="text-sm font-medium text-gray-400">Direct Video Link</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Link className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://example.com/path/to/video.mp4"
                        className="w-full pl-12 pr-4 py-4 bg-gray-950 border border-gray-700 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        disabled={isProcessing || isFetchingUrl}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Note: The URL must point directly to a media file and allow Cross-Origin Resource Sharing (CORS).
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col justify-center h-full pt-10">
              <button
                onClick={handleLaunch}
                disabled={isLaunchDisabled}
                className="w-full py-5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:shadow-none flex items-center justify-center gap-3 group"
              >
                {isProcessing || isFetchingUrl ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isFetchingUrl ? 'Fetching...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                    Launch Engine
                  </>
                )}
              </button>
              {mockMode && ((uploadMode === 'file' && !videoFile) || (uploadMode === 'url' && !videoUrl)) && (
                <p className="text-xs text-orange-400 text-center mt-3">
                  Mock mode active: Launch available without input.
                </p>
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{errorMsg}</p>
          </div>
        )}

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
