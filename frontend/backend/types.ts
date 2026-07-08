export interface Chapter {
  timestamp: string;
  title: string;
  summary: string;
}

export interface Hook {
  start_time: string;
  end_time: string;
  justification: string;
}

export interface Clip {
  id: string;
  path: string;
  duration: string;
}

export interface ProcessPayload {
  transcript: string;
  chapters: Chapter[];
  hooks: Hook[];
  clips: Clip[];
  compliance_passed: boolean;
  violations_found: string[];
  seo_titles: string[];
}

export type AgentStatus = 'dormant' | 'processing' | 'complete' | 'error';

export interface SSEMessage {
  agent: 'Director' | 'Compliance' | 'Video Composer' | 'Workspace Dispatcher' | 'System';
  status: AgentStatus | 'finished';
  message?: string;
  payload?: ProcessPayload;
}
