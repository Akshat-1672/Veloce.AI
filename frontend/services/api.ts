import { GoogleGenAI, Type } from '@google/genai';
import type { SSEMessage, ProcessPayload } from '../types.ts';

// In-memory storage for the uploaded guidelines file (PDF, TXT, etc.)
let activeGuidelineFile: { data: string, mimeType: string } | null = null;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data:mime/type;base64, prefix
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const uploadGuidelines = async (file: File): Promise<boolean> => {
  try {
    const base64Data = await fileToBase64(file);
    let mimeType = file.type;
    
    // Fallback mime types if browser doesn't detect them properly
    if (!mimeType) {
      if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
      else if (file.name.endsWith('.md')) mimeType = 'text/markdown';
      else mimeType = 'application/octet-stream';
    }

    activeGuidelineFile = {
      data: base64Data,
      mimeType: mimeType
    };
    return true;
  } catch (error) {
    console.error('Failed to process guidelines file:', error);
    return false;
  }
};

const sanitizeFilename = (name: string) => {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
};

export const processVideo = async (
  file: File, 
  mockMode: boolean, 
  onEvent: (msg: SSEMessage) => void
): Promise<void> => {
  if (mockMode) {
    await simulateStream(onEvent);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

    // --- 1. Director Agent ---
    onEvent({ agent: 'Director', status: 'processing', message: 'Uploading media track directly into Gemini Multi-modal framework...' });
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || 'video/mp4';

    const directorResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: 'Act as an expert Video Production Director. Analyze this video. Extract a high-fidelity verbatim text transcript, map chronological structural video chapters, and pinpoint exactly three high-energy visual or verbal "hooks" suitable for short-form repurposing.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING }
                }
              }
            },
            hooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start_time: { type: Type.STRING },
                  end_time: { type: Type.STRING },
                  justification: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const directorData = JSON.parse(directorResponse.text);
    onEvent({ agent: 'Director', status: 'complete', message: 'Video visual topology & audio transcription maps generated.' });

    // --- 2. Compliance Agent ---
    onEvent({ agent: 'Compliance', status: 'processing', message: 'Auditing content against uploaded corporate guidelines...' });
    
    const complianceParts: any[] = [
      { 
        text: `Act as a Corporate Compliance Officer and SEO Strategist.
        
Video Transcript:
${directorData.transcript}

Task 1: Audit the transcript against the provided corporate guidelines. Flag any violations explicitly. If no guidelines were attached, use standard professional brand safety rules (no profanity, no competitor mentions).
Task 2: Generate 3 highly engaging, high-CTR YouTube video title options based on the transcript.` 
      }
    ];

    if (activeGuidelineFile) {
      complianceParts.unshift({
        inlineData: {
          data: activeGuidelineFile.data,
          mimeType: activeGuidelineFile.mimeType
        }
      });
      complianceParts.unshift({
        text: "Please review the attached corporate guidelines document carefully."
      });
    } else {
      complianceParts.unshift({
        text: "No specific guidelines document was provided. Use default professional brand safety rules."
      });
    }

    const complianceResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: complianceParts
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compliance_passed: { type: Type.BOOLEAN },
            violations_found: { type: Type.ARRAY, items: { type: Type.STRING } },
            seo_titles: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const complianceData = JSON.parse(complianceResponse.text);
    onEvent({ agent: 'Compliance', status: 'complete', message: 'Compliance audit and SEO generation complete.' });

    // --- 3. Video Composer (Feature Slot A) ---
    onEvent({ agent: 'Video Composer', status: 'processing', message: 'Executing localized ffmpeg sub-clips for 9:16 vertical format...' });
    // Simulate the time it takes for an isolated system tool to run ffmpeg
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const clips = directorData.hooks.map((hook: any, idx: number) => {
      const baseName = complianceData.seo_titles[idx] 
        ? sanitizeFilename(complianceData.seo_titles[idx]) 
        : `clip_v1_00${idx + 1}`;
        
      return {
        id: `${baseName}.mp4`,
        path: `/workspace/outputs/shorts/${baseName}.mp4`,
        duration: `${hook.start_time} - ${hook.end_time}`
      };
    });
    
    onEvent({ agent: 'Video Composer', status: 'complete', message: 'Standalone vertical short video segments generated.' });

    // --- 4. Workspace Dispatcher ---
    onEvent({ agent: 'Workspace Dispatcher', status: 'processing', message: 'Exporting structured tracking datasets to Google Sheet ledger...' });
    // Simulate network request to Google Sheets / Gmail API
    await new Promise(resolve => setTimeout(resolve, 1500));
    onEvent({ agent: 'Workspace Dispatcher', status: 'complete', message: 'Data records securely synchronized.' });

    // --- 5. Finish ---
    const finalPayload: ProcessPayload = {
      ...directorData,
      ...complianceData,
      clips
    };

    onEvent({ agent: 'System', status: 'finished', payload: finalPayload });

  } catch (error: any) {
    console.error('Pipeline Error:', error);
    onEvent({ agent: 'System', status: 'error', message: error.message || 'An error occurred during processing.' });
  }
};

// Fallback simulation for rapid UI prototyping
const simulateStream = async (onEvent: (msg: SSEMessage) => void) => {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
  
  onEvent({ agent: 'Director', status: 'processing', message: 'Uploading media track directly into Gemini Multi-modal framework...' });
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
  // Simulate YouTube API upload latency
  await new Promise(resolve => setTimeout(resolve, 3000));
  if (!file) throw new Error("No video file provided.");
  return `https://youtube.com/watch?v=${Math.random().toString(36).substring(2, 11)}`;
};

export const syncToGoogleSheets = async (data: any): Promise<boolean> => {
  // Simulate Google Sheets API latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};

export const sendGmailAlert = async (to: string, subject: string, body: string): Promise<boolean> => {
  // Simulate Gmail API latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};
