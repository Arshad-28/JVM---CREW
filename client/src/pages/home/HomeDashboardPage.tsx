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
        <div className="bg-paper-light border border-line rounded-md p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-ink uppercase">Current Lead: {user?.name}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{user?.position || 'SDE Intern'}</span>
            <span className="px-2 py-0.5 bg-primary-soft border border-primary/20 text-primary rounded-xs text-[10px] font-bold">
              MONTHLY ROTATION
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-paper-dark p-1 rounded-sm border border-line w-full sm:w-auto">
            <button
              onClick={() => setViewMode('PERSONAL')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xs font-mono text-xs font-bold transition-all duration-160 flex items-center justify-center space-x-1.5 ${
                viewMode === 'PERSONAL'
                  ? 'bg-paper-light text-primary shadow-2xs border border-primary/20'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${viewMode === 'PERSONAL' ? 'text-primary' : 'text-muted'}`} />
              <span>MY PERSONAL DAY</span>
            </button>

            <button
              onClick={() => setViewMode('COCKPIT')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xs font-mono text-xs font-bold transition-all duration-160 flex items-center justify-center space-x-1.5 ${
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
