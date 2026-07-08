import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Workspace } from './components/Workspace.tsx';
import { IntegrationsModal } from './components/IntegrationsModal.tsx';
import type { IntegrationsState } from './types.ts';

const App: React.FC = () => {
  const [mockMode, setMockMode] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationsState>({
    youtube: false,
    sheets: false,
    gmail: false
  });

  return (
    <div className="flex h-screen w-full bg-gray-950 font-sans">
      <Sidebar 
        mockMode={mockMode} 
        setMockMode={setMockMode} 
        onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
      />
      <Workspace 
        mockMode={mockMode} 
        integrations={integrations}
        onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
      />
      
      <IntegrationsModal 
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        integrations={integrations}
        setIntegrations={setIntegrations}
      />
    </div>
  );
};

export default App;
