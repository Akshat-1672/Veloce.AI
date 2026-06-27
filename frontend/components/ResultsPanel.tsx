import React, { useState } from 'react';
import type { ProcessPayload, Clip, IntegrationsState } from '../types.ts';
import { ChevronDown, ChevronUp, PlayCircle, Scissors, ShieldCheck, ShieldAlert, Database, Smartphone, Download, Loader2, FileText, Mail, ExternalLink, PlaySquare, CheckCircle2 } from 'lucide-react';
import { publishToYouTube, syncToGoogleSheets, sendGmailAlert } from '../services/api.ts';

interface ResultsPanelProps {
  payload: ProcessPayload;
  videoFile: File | null;
  integrations: IntegrationsState;
  onOpenIntegrations: () => void;
}

const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.replace(/[^0-9:.]/g, '');
  const parts = cleanStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(cleanStr) || 0;
};

const extractClip = async (file: File, startTime: number, endTime: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';
    video.style.display = 'none';
    document.body.appendChild(video);

    let isRecording = false;

    video.onloadedmetadata = () => {
      const safeEndTime = Math.min(endTime, video.duration);
      const safeStartTime = Math.min(startTime, safeEndTime - 1);
      
      video.currentTime = safeStartTime;
      
      video.onseeked = () => {
        if (isRecording) return;
        isRecording = true;
        
        try {
          const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
          if (!stream) {
            throw new Error("Browser does not support video.captureStream()");
          }
          
          let options = {};
          if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
            options = { mimeType: 'video/webm; codecs=vp9' };
          } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options = { mimeType: 'video/webm' };
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4' };
          }

          const recorder = new MediaRecorder(stream, options);
          const chunks: BlobPart[] = [];
          
          recorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          
          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
            video.pause();
            document.body.removeChild(video);
            URL.revokeObjectURL(video.src);
          };
          
          recorder.start();
          video.play().catch(e => {
            // Fallback to muted if autoplay policy blocks unmuted playback
            video.muted = true;
            video.play().catch(reject);
          });

          setTimeout(() => {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, (safeEndTime - safeStartTime) * 1000);
          
        } catch (err) {
          reject(err);
          document.body.removeChild(video);
          URL.revokeObjectURL(video.src);
        }
      };
    };

    video.onerror = () => {
      reject(new Error("Failed to load video file"));
      document.body.removeChild(video);
      URL.revokeObjectURL(video.src);
    };
  });
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ payload, videoFile, integrations, onOpenIntegrations }) => {
  const [seoExpanded, setSeoExpanded] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Action states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleDownload = async (clip: Clip) => {
    if (!videoFile) {
      const content = `[SIMULATED VIDEO ASSET]\n\nFile: ${clip.id}\nOriginal Path: ${clip.path}\nDuration: ${clip.duration}\n\nNo source video file was provided to clip from.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      setDownloadingId(clip.id);
      const parts = clip.duration.split('-');
      const startTime = parseTime(parts[0]);
      const endTime = parts.length > 1 ? parseTime(parts[1]) : startTime + 15;
      
      const blob = await extractClip(videoFile, startTime, endTime);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const ext = blob.type.includes('mp4') ? '.mp4' : '.webm';
      a.download = `${clip.id.replace('.mp4', '')}${ext}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Clipping failed", err);
      alert("Failed to generate clip in browser. " + (err as Error).message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportCSV = () => {
    const videoName = videoFile ? videoFile.name : 'mock_video.mp4';
    const date = new Date().toLocaleString();
    const complianceStatus = payload.compliance_passed ? 'PASSED' : 'FAILED';
    const violations = payload.violations_found.join('; ') || 'None';
    const topTitle = payload.seo_titles[0] || 'N/A';

    const escapeCSV = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

    let csvContent = `Date,Video Name,Compliance Status,Violations,Top SEO Title\n`;
    csvContent += `${escapeCSV(date)},${escapeCSV(videoName)},${escapeCSV(complianceStatus)},${escapeCSV(violations)},${escapeCSV(topTitle)}\n\n`;

    csvContent += `Generated Clips Log\n`;
    csvContent += `Clip ID,Duration,Path\n`;
    
    if (payload.clips && payload.clips.length > 0) {
      payload.clips.forEach(clip => {
        csvContent += `${escapeCSV(clip.id)},${escapeCSV(clip.duration)},${escapeCSV(clip.path)}\n`;
      });
    } else {
      csvContent += `No clips generated,, \n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veloce_ledger_sync_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePublishYouTube = async () => {
    if (!integrations.youtube) {
      onOpenIntegrations();
      return;
    }
    setIsPublishing(true);
    try {
      const url = await publishToYouTube(videoFile, payload.seo_titles[0], payload.chapters.map(c => `${c.timestamp} ${c.title}`).join('\n'));
      setPublishedUrl(url);
    } catch (e) {
      alert("Failed to publish to YouTube.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSyncSheets = async () => {
    if (!integrations.sheets) {
      onOpenIntegrations();
      return;
    }
    setIsSyncing(true);
    try {
      await syncToGoogleSheets(payload);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (e) {
      alert("Failed to sync to Google Sheets.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!integrations.gmail) {
      onOpenIntegrations();
      return;
    }
    setIsEmailing(true);
    try {
      const subject = `[URGENT] Compliance Violation: ${videoFile?.name || 'Video Upload'}`;
      const body = `Hello Team,\n\nThe Veloce.AI Compliance Agent detected the following violations in the recent video upload:\n\n` +
        payload.violations_found.map(v => `- ${v}`).join('\n') +
        `\n\nPlease review the content immediately before publishing.\n\n- Veloce.AI Dispatcher`;
      
      await sendGmailAlert('legal@company.com', subject, body);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (e) {
      alert("Failed to send email.");
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Optimized Production Assets */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <h3 className="text-xl font-semibold text-gray-100">📈 Optimized Production Assets</h3>
          </div>

          {/* Component A: SEO Titles Accordion */}
          <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50">
            <button 
              onClick={() => setSeoExpanded(!seoExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
            >
              <span className="font-medium text-gray-200">Generated SEO Title Options</span>
              {seoExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {seoExpanded && (
              <div className="p-4 space-y-2">
                {payload.seo_titles.map((title, idx) => (
                  <div key={idx} className="p-3 bg-gray-950 rounded-lg border border-gray-800 text-sm text-gray-300 flex items-start gap-3">
                    <span className="text-blue-500 font-mono mt-0.5">{idx + 1}.</span>
                    {title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Component B: Navigational Video Chapters */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <h4 className="font-medium text-gray-200 mb-4 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-blue-400" />
              Navigational Video Chapters
            </h4>
            <div className="relative border-l-2 border-gray-800 ml-3 space-y-6 pb-2">
              {payload.chapters.map((chapter, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-blue-500"></div>
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                      {chapter.timestamp}
                    </span>
                    <span className="font-medium text-gray-200">{chapter.title}</span>
                  </div>
                  <p className="text-sm text-gray-500">{chapter.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Component C: Extracted Media Hooks */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <h4 className="font-medium text-gray-200 mb-4 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-400" />
              Extracted Media Hooks
            </h4>
            <div className="space-y-3">
              {payload.hooks.map((hook, idx) => (
                <div key={idx} className="p-4 bg-gray-950 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
                      {hook.start_time} - {hook.end_time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{hook.justification}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Compliance Audit Reporting & Deliverables */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <h3 className="text-xl font-semibold text-gray-100">🛡️ Brand Compliance & Deliverables</h3>
          </div>

          {/* Component A: Status Badge */}
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center gap-3 ${
            payload.compliance_passed 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {payload.compliance_passed ? (
              <>
                <ShieldCheck className="w-12 h-12 text-green-500" />
                <h2 className="text-2xl font-bold text-green-400 tracking-wide">PASSED</h2>
                <p className="text-sm text-green-500/80">Content aligns with active corporate guidelines.</p>
              </>
            ) : (
              <>
                <ShieldAlert className="w-12 h-12 text-red-500" />
                <h2 className="text-2xl font-bold text-red-400 tracking-wide">VIOLATION DETECTED</h2>
                <p className="text-sm text-red-500/80">Safety rules or brand guidelines breached.</p>
              </>
            )}
          </div>

          {/* Component B: Violations List */}
          {!payload.compliance_passed && payload.violations_found.length > 0 && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5">
              <h4 className="font-medium text-red-400 mb-3">Detected Infractions:</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-red-300/90">
                {payload.violations_found.map((violation, idx) => (
                  <li key={idx}>{violation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Component C: Programmatic Clips (Feature Slot A) */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <h4 className="font-medium text-gray-200 mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-pink-400" />
              Programmatic Clips (9:16 Vertical)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {payload.clips?.map((clip, idx) => (
                <div key={idx} className="p-3 bg-gray-950 rounded-lg border border-gray-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300 truncate mr-2" title={clip.id}>{clip.id}</span>
                    <span className="text-[10px] font-mono text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded shrink-0">
                      {clip.duration}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate" title={clip.path}>
                    {clip.path}
                  </div>
                  <button 
                    onClick={() => handleDownload(clip)}
                    disabled={downloadingId === clip.id}
                    className="mt-1 w-full py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-500 text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    {downloadingId === clip.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating (Real-time)...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        Download Asset
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Component D: Workspace Dispatcher Actions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <h4 className="font-medium text-gray-200 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Workspace Integrations
            </h4>
            
            <div className="space-y-3">
              {/* YouTube Publishing */}
              {payload.compliance_passed && (
                <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded text-red-500">
                      <PlaySquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">YouTube Publishing</p>
                      <p className="text-xs text-gray-500">Upload video with SEO title & chapters</p>
                    </div>
                  </div>
                  {publishedUrl ? (
                    <a 
                      href={publishedUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-green-600/20 text-green-400 text-xs font-medium rounded flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Published
                    </a>
                  ) : (
                    <button 
                      onClick={handlePublishYouTube}
                      disabled={isPublishing}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                        integrations.youtube ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                      {integrations.youtube ? 'Publish Now' : 'Connect to Publish'}
                    </button>
                  )}
                </div>
              )}

              {/* Google Sheets Sync */}
              <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded text-green-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Master Ledger Sync</p>
                    <p className="text-xs text-gray-500">Append comprehensive row to Google Sheets</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                  <button 
                    onClick={handleSyncSheets}
                    disabled={isSyncing || syncSuccess}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                      syncSuccess ? 'bg-green-600/20 text-green-400' :
                      integrations.sheets ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     syncSuccess ? <CheckCircle2 className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                    {syncSuccess ? 'Synced' : integrations.sheets ? 'Sync Now' : 'Connect to Sync'}
                  </button>
                </div>
              </div>

              {/* Gmail Alert (Only if violations exist) */}
              {!payload.compliance_passed && (
                <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded text-red-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">Compliance Alert</p>
                      <p className="text-xs text-gray-500">Send email to legal team</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSendEmail}
                    disabled={isEmailing || emailSuccess}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                      emailSuccess ? 'bg-green-600/20 text-green-400' :
                      integrations.gmail ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {isEmailing ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     emailSuccess ? <CheckCircle2 className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                    {emailSuccess ? 'Sent' : integrations.gmail ? 'Send Alert' : 'Connect to Send'}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
