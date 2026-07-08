import { sanitizeFilename } from '../utils.ts';

export const runComposerAgent = async (hooks: any[], seoTitles: string[]) => {
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  return hooks.map((hook: any, idx: number) => {
    const baseName = seoTitles[idx] 
      ? sanitizeFilename(seoTitles[idx]) 
      : `clip_v1_00${idx + 1}`;
      
    return {
      id: `${baseName}.mp4`,
      path: `/workspace/outputs/shorts/${baseName}.mp4`,
      duration: `${hook.start_time} - ${hook.end_time}`
    };
  });
};
