import React, { useState } from 'react';
import { X, PlaySquare, Table, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import type { IntegrationsState } from '../types.ts';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrations: IntegrationsState;
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationsState>>;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose, integrations, setIntegrations }) => {
  const [loading, setLoading] = useState<keyof IntegrationsState | null>(null);

  if (!isOpen) return null;

  const handleToggle = (key: keyof IntegrationsState) => {
    if (integrations[key]) {
      setIntegrations(prev => ({ ...prev, [key]: false }));
    } else {
      setLoading(key);
      setTimeout(() => {
        setIntegrations(prev => ({ ...prev, [key]: true }));
        setLoading(null);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Workspace Integrations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-400 mb-4">
            Authenticate with your accounts to enable one-click publishing and automated workspace synchronization.
          </p>

          <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${integrations.youtube ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                <PlaySquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">YouTube</p>
                <p className="text-xs text-gray-500">{integrations.youtube ? 'Connected as Veloce Studio' : 'Not connected'}</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('youtube')}
              disabled={loading !== null}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                integrations.youtube 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {loading === 'youtube' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {integrations.youtube ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${integrations.sheets ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-400'}`}>
                <Table className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">Google Sheets</p>
                <p className="text-xs text-gray-500">{integrations.sheets ? 'Connected to Master Ledger' : 'Not connected'}</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('sheets')}
              disabled={loading !== null}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                integrations.sheets 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {loading === 'sheets' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {integrations.sheets ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${integrations.gmail ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">Gmail</p>
                <p className="text-xs text-gray-500">{integrations.gmail ? 'Connected as legal@company.com' : 'Not connected'}</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('gmail')}
              disabled={loading !== null}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                integrations.gmail 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {loading === 'gmail' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {integrations.gmail ? 'Disconnect' : 'Connect'}
            </button>
          </div>

        </div>
        
        <div className="p-5 border-t border-gray-800 bg-gray-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
