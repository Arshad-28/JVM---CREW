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
        <div className="bg-paper border border-line rounded-sm p-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-bold text-ink uppercase">Current Lead: {user?.name}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{user?.position || 'SDE Intern'}</span>
            <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-xs text-[10px] font-bold">
              MONTHLY ROTATION
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-paper-dark p-1 rounded-xs border border-line w-full sm:w-auto">
            <button
              onClick={() => setViewMode('PERSONAL')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xs font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                viewMode === 'PERSONAL'
                  ? 'bg-paper text-ink shadow-xs border border-line'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>MY PERSONAL DAY</span>
            </button>

            <button
              onClick={() => setViewMode('COCKPIT')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xs font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                viewMode === 'COCKPIT'
                  ? 'bg-ink text-paper shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
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

