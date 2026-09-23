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
        <div className="bg-gradient-to-r from-paper-light via-paper to-paper-light border border-line rounded-xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-xs transition-all duration-200 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-primary-soft border border-primary/25 text-primary text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>LEAD DESK</span>
            </span>
            <span className="font-bold text-ink text-xs">{user?.name}</span>
            <span className="text-muted/60">·</span>
            <span className="text-muted font-medium">{user?.position || 'SDE Intern'}</span>
            <span className="px-2 py-0.5 bg-paper-dark border border-line text-muted rounded-md text-[10px] font-bold tracking-wider uppercase">
              MONTHLY ROTATION
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-paper-dark/90 p-1 rounded-lg border border-line/80 w-full sm:w-auto shadow-inner">
            <button
              onClick={() => setViewMode('PERSONAL')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md font-mono text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                viewMode === 'PERSONAL'
                  ? 'bg-paper text-primary shadow-xs border border-primary/20'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${viewMode === 'PERSONAL' ? 'text-primary' : 'text-muted'}`} />
              <span>MY PERSONAL DAY</span>
            </button>

            <button
              onClick={() => setViewMode('COCKPIT')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md font-mono text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                viewMode === 'COCKPIT'
                  ? 'bg-primary text-white shadow-xs'
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
