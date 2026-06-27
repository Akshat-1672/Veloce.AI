import React, { useState, useRef } from 'react';
import { Settings, CheckCircle2, AlertCircle, Upload, FileText, Link2 } from 'lucide-react';
import { uploadGuidelines } from '../services/api.ts';

interface SidebarProps {
  mockMode: boolean;
  setMockMode: (val: boolean) => void;
  onOpenIntegrations: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mockMode, setMockMode, onOpenIntegrations }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSync = async () => {
    if (!file) return;
    setIsUploading(true);
    setToast(null);
    
    const success = await uploadGuidelines(file);
    
    setIsUploading(false);
    if (success) {
      setToast({ type: 'success', msg: 'Guidelines uploaded successfully.' });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setToast({ type: 'error', msg: 'Failed to upload guidelines.' });
    }

    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-600/20 rounded-lg">
          <Settings className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className="text-lg font-bold tracking-wide text-gray-100">Brand Config</h2>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Upload Corporate Guidelines (.pdf, .txt)
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              id="guidelines-upload"
            />
            <label
              htmlFor="guidelines-upload"
              className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 truncate max-w-[220px]">
                  {file ? file.name : 'Select PDF or Text file...'}
                </span>
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Upload your brand safety rules or legal handbook. The Compliance Agent will use Gemini to audit videos against this document.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={!file || isUploading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Synchronize Guidelines'
          )}
        </button>

        {toast && (
          <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {toast.msg}
          </div>
        )}

        <hr className="border-gray-800 my-6" />

        <button
          onClick={onOpenIntegrations}
          className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-700"
        >
          <Link2 className="w-4 h-4" />
          Manage Integrations
        </button>

        <hr className="border-gray-800 my-6" />

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-5 h-5 border-2 border-gray-600 rounded bg-gray-900 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
            <CheckCircle2 className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Execute App in Mock Prototyping Mode
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Bypasses live media upload latency for rapid UI testing.
            </span>
          </div>
        </label>
      </div>
      
      <div className="mt-auto pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">Veloce.AI Engine v1.3.0</p>
      </div>
    </div>
  );
};
