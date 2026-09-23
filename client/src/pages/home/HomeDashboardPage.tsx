import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MemberWorkspaceView } from './MemberWorkspaceView';
import { LeadDailyBriefView } from './LeadDailyBriefView';
import { LayoutDashboard, Users } from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';

interface HomeDashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const HomeDashboardPage: React.FC<HomeDashboardPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const isLeadOrAdmin = user?.role === 'LEAD' || user?.role === 'ADMIN';

  // For the Lead: allow effortless switching between Personal Workspace and Team Cockpit
  const [viewMode, setViewMode] = useState<'PERSONAL' | 'COCKPIT'>('PERSONAL');

  return (
    <PageContainer width="default" className="space-y-6">
      {/* Lead Dual-Role Mode Switcher Bar */}
      {isLeadOrAdmin && (
        <div className="w-full max-w-[1000px] mx-auto bg-paper-light border border-line/80 rounded-xl p-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-semibold text-ink uppercase text-[11px] tracking-wide">
              Lead Workspace: {user?.name}
            </span>
            <span className="text-muted/60">·</span>
            <span className="text-muted font-sans text-xs">{user?.position || 'SDE Intern'}</span>
          </div>

          <div className="flex items-center space-x-1 bg-paper-dark/70 p-0.5 rounded-lg border border-line/80 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('PERSONAL')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md font-mono text-xs font-semibold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                viewMode === 'PERSONAL'
                  ? 'bg-paper text-primary shadow-2xs border border-line/60 font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${viewMode === 'PERSONAL' ? 'text-primary' : 'text-muted'}`} />
              <span>MY PERSONAL DAY</span>
            </button>

            <button
              onClick={() => setViewMode('COCKPIT')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md font-mono text-xs font-semibold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                viewMode === 'COCKPIT'
                  ? 'bg-primary text-white shadow-2xs font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>TEAM COCKPIT BRIEF</span>
            </button>
          </div>
        </div>
      )}

      {isLeadOrAdmin && viewMode === 'COCKPIT' ? (
        <LeadDailyBriefView onNavigateTab={onNavigateTab} />
      ) : (
        <MemberWorkspaceView onNavigateTab={onNavigateTab} />
      )}
    </PageContainer>
  );
};
