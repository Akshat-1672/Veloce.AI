import React from 'react';
import { CheckCircle2, Loader2, Moon, AlertTriangle } from 'lucide-react';
import type { AgentStatus } from '../types.ts';

interface TelemetryCardProps {
  title: string;
  icon: React.ReactNode;
  status: AgentStatus;
  message: string;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({ title, icon, status, message }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'processing':
        return 'border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
      case 'complete':
        return 'border-green-500/50 bg-green-500/5';
      case 'error':
        return 'border-red-500/50 bg-red-500/5';
      default:
        return 'border-gray-800 bg-gray-900/50';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 text-orange-400 text-xs font-medium bg-orange-400/10 px-2 py-1 rounded-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running
          </div>
        );
      case 'complete':
        return (
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-400/10 px-2 py-1 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium bg-gray-800 px-2 py-1 rounded-md">
            <Moon className="w-3.5 h-3.5" />
            Dormant
          </div>
        );
    }
  };

  return (
    <div className={`p-5 rounded-xl border transition-all duration-500 flex flex-col h-full ${getStatusStyles()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gray-800 rounded-lg text-gray-300">
            {icon}
          </div>
          <h3 className="font-semibold text-gray-200">{title}</h3>
        </div>
        {getStatusBadge()}
      </div>
      <div className="mt-auto">
        <p className={`text-sm ${status === 'dormant' ? 'text-gray-600' : 'text-gray-400'} leading-relaxed`}>
          {message}
        </p>
      </div>
    </div>
  );
};
