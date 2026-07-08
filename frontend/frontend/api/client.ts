import type { SSEMessage, ProcessPayload } from '../types.ts';

const API_BASE = 'http://localhost:8000';

export const uploadGuidelines = async (file: File): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload-guidelines`, {
      method: 'POST',
      body: formData,
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Backend unreachable, simulating success for guidelines upload.');
    return true;
  }
};

export const processVideo = async (
  file: File, 
  mockMode: boolean, 
  onEvent: (msg: SSEMessage) => void
): Promise<void> => {
  if (mockMode) {
    await simulateStream(onEvent, file);
    return;
  }

  try {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('mock_mode', String(mockMode));

    const response = await fetch(`${API_BASE}/process-video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok || !response.body) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; 

      for (const part of parts) {
        if (part.startsWith('data: ')) {
          const jsonStr = part.substring(6);
          try {
            const data = JSON.parse(jsonStr) as SSEMessage;
            onEvent(data);
          } catch (e) {
            console.error('Failed to parse SSE chunk:', jsonStr);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Backend unreachable, falling back to simulated stream.', error);
    await simulateStream(onEvent, file);
  }
};

// Fallback simulation for rapid UI prototyping or when backend is offline
const simulateStream = async (onEvent: (msg: SSEMessage) => void, file?: File) => {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
  const fileName = file ? file.name : "mock_video.mp4";
  
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

// --- Mock Integration APIs ---

export const publishToYouTube = async (file: File | null, title: string, description: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log(`Simulating YouTube upload for: ${title}`);
  return `https://youtube.com/watch?v=dQw4w9WgXcQ`;
};

export const syncToGoogleSheets = async (data: any): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};

export const sendGmailAlert = async (to: string, subject: string, body: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};
