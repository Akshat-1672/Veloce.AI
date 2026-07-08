import { runDirectorAgent } from './agents/director.ts';
import { runComplianceAgent } from './agents/compliance.ts';
import { runComposerAgent } from './agents/composer.ts';
import { runDispatcherAgent } from './agents/dispatcher.ts';
import { store } from './store.ts';
import type { SSEMessage, ProcessPayload } from './types.ts';

export const runPipeline = async (file: any, mockMode: boolean, onEvent: (msg: SSEMessage) => void) => {
  if (mockMode) {
    await runMockPipeline(file, onEvent);
    return;
  }

  try {
    onEvent({ agent: 'Director', status: 'processing', message: 'Uploading media track directly into Gemini Multi-modal framework...' });
    const base64Data = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'video/mp4';
    const directorData = await runDirectorAgent(base64Data, mimeType);
    onEvent({ agent: 'Director', status: 'complete', message: 'Video visual topology & audio transcription maps generated.' });

    onEvent({ agent: 'Compliance', status: 'processing', message: 'Auditing content against uploaded corporate guidelines...' });
    const complianceData = await runComplianceAgent(directorData.transcript, store.activeGuidelineFile);
    onEvent({ agent: 'Compliance', status: 'complete', message: 'Compliance audit and SEO generation complete.' });

    onEvent({ agent: 'Video Composer', status: 'processing', message: 'Executing localized ffmpeg sub-clips for 9:16 vertical format...' });
    const clips = await runComposerAgent(directorData.hooks, complianceData.seo_titles);
    onEvent({ agent: 'Video Composer', status: 'complete', message: 'Standalone vertical short video segments generated.' });

    onEvent({ agent: 'Workspace Dispatcher', status: 'processing', message: 'Exporting structured tracking datasets to Google Sheet ledger...' });
    await runDispatcherAgent({ ...directorData, ...complianceData, clips });
    onEvent({ agent: 'Workspace Dispatcher', status: 'complete', message: 'Data records securely synchronized.' });

    const finalPayload: ProcessPayload = {
      ...directorData,
      ...complianceData,
      clips
    };

    onEvent({ agent: 'System', status: 'finished', payload: finalPayload });

  } catch (error: any) {
    console.error('Pipeline Error:', error);
    let errorMessage = error.message || 'An error occurred during processing.';
    
    if (typeof errorMessage === 'string' && (errorMessage.includes('413') || errorMessage.includes('Payload Too Large'))) {
      errorMessage = 'The video file is too large for the Vertex AI endpoint (Payload Too Large). Please use a smaller video (under 14MB).';
    } else if (error.status === 413 || error.code === 413) {
      errorMessage = 'The video file is too large for the Vertex AI endpoint (Payload Too Large). Please use a smaller video (under 14MB).';
    }
    
    onEvent({ agent: 'System', status: 'error', message: errorMessage });
  }
};

const runMockPipeline = async (file: any, onEvent: (msg: SSEMessage) => void) => {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
  const fileName = file ? file.originalname : "mock_video.mp4";
  
  onEvent({ agent: 'Director', status: 'processing', message: `Uploading ${fileName} directly into Gemini Multi-modal framework...` });
  await delay(2000);
  onEvent({ agent: 'Director', status: 'complete', message: 'Video visual topology & audio transcription maps generated.' });
  
  onEvent({ agent: 'Compliance', status: 'processing', message: `Auditing content against uploaded corporate guidelines...` });
  await delay(2000);
  onEvent({ agent: 'Compliance', status: 'complete', message: 'Compliance audit and SEO generation complete.' });
  
  onEvent({ agent: 'Video Composer', status: 'processing', message: 'Executing localized ffmpeg sub-clips for 9:16 vertical format...' });
  await delay(2500);
  onEvent({ agent: 'Video Composer', status: 'complete', message: 'Standalone vertical short video segments generated.' });

  onEvent({ agent: 'Workspace Dispatcher', status: 'processing', message: 'Exporting structured tracking datasets to Google Sheet ledger...' });
  await delay(1500);
  onEvent({ agent: 'Workspace Dispatcher', status: 'complete', message: 'Data records securely synchronized.' });
  
  onEvent({
    agent: 'System',
    status: 'finished',
    payload: {
      transcript: "Welcome to the future of AI video production. Today we are looking at how multi-agent systems can completely automate your post-production workflow...",
      chapters: [
        { timestamp: "00:00", title: "Introduction", summary: "Overview of Veloce.AI capabilities." },
        { timestamp: "01:15", title: "Multi-Agent Architecture", summary: "Deep dive into the Director and Compliance agents." },
        { timestamp: "03:45", title: "Workspace Integration", summary: "Automated syncing with Google Sheets and Gmail." }
      ],
      hooks: [
        { start_time: "01:22", end_time: "01:45", justification: "High energy explanation of the core value proposition." },
        { start_time: "04:10", end_time: "04:30", justification: "Strong visual demonstration of the automated email draft." }
      ],
      clips: [
        { id: "how_multi_agent_ai_is_revolu.mp4", path: "/workspace/outputs/shorts/how_multi_agent_ai_is_revolu.mp4", duration: "01:22 - 01:45" },
        { id: "automate_your_video_workflow_w.mp4", path: "/workspace/outputs/shorts/automate_your_video_workflow_w.mp4", duration: "04:10 - 04:30" }
      ],
      compliance_passed: true,
      violations_found: [],
      seo_titles: [
        "How Multi-Agent AI is Revolutionizing Video Production",
        "Automate Your Video Workflow with Veloce.AI",
        "The Ultimate Guide to AI-Powered Compliance Audits"
      ]
    }
  });
};
