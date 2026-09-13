import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { LoginPage } from './pages/auth/LoginPage';
import { HomeDashboardPage } from './pages/home/HomeDashboardPage';
import { KanbanBoardPage } from './pages/tasks/KanbanBoardPage';
import { TeamDashboardPage } from './pages/team/TeamDashboardPage';
import { HomeworkPage } from './pages/homework/HomeworkPage';
import { MeetTheCrewPage } from './pages/crew/MeetTheCrewPage';
import { MyProfilePage } from './pages/profile/MyProfilePage';
import { AccountSettingsPage } from './pages/settings/AccountSettingsPage';
import { InterviewLabPage } from './pages/interview/InterviewLabPage';
import { DailyStandupModal } from './pages/standup/DailyStandupModal';
import { LeaveEmailModal } from './components/common/LeaveEmailModal';
import { cleanTeamDisplayName } from './utils/greetingEngine';
import { api, getLocalTodayDateString } from './services/api';



const getTabFromPath = (): string => {
  const path = window.location.pathname.toLowerCase().replace(/^\/+/, '');
  if (path === 'my-day' || path === 'myday' || path === 'home' || path === '') return 'home';
  if (path === 'settings' || path === 'account-settings') return 'settings';
  if (path === 'tasks' || path === 'my-tasks') return 'tasks';
  if (path === 'homework' || path === 'my-homework') return 'homework';
  if (path === 'learning' || path === 'curriculum') return 'home';
  if (path === 'interview-lab' || path === 'interview' || path === 'interview-prep') return 'interview-lab';
  if (path === 'team' || path === 'team-cockpit') return 'team';
  if (path === 'crew' || path === 'meet-the-crew') return 'crew';
  if (path === 'profile' || path === 'my-profile') return 'profile';
  return 'home';
};

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(getTabFromPath);
  const [labInitialTopic, setLabInitialTopic] = useState<string>('');
  const [globalStandupOpen, setGlobalStandupOpen] = useState(false);
  const [globalStandupViewOnly, setGlobalStandupViewOnly] = useState(false);
  const [standupDoneToday, setStandupDoneToday] = useState(false);
  const [globalLeaveEmailOpen, setGlobalLeaveEmailOpen] = useState(false);

  // Sync tab with browser URL history
  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    const targetPath = tab === 'home' ? '/my-day' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  // Fresh login navigation to /my-day
  useEffect(() => {
    const handleFreshLogin = () => {
      setActiveTab('home');
      if (window.location.pathname !== '/my-day') {
        window.history.replaceState({ tab: 'home' }, '', '/my-day');
      }
    };
    window.addEventListener('jvm_fresh_login', handleFreshLogin);
    return () => window.removeEventListener('jvm_fresh_login', handleFreshLogin);
  }, []);

  useEffect(() => {
    if (user && (window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '')) {
      setActiveTab('home');
      window.history.replaceState({ tab: 'home' }, '', '/my-day');
    }
  }, [user]);

  const checkStandupStatus = async () => {
    if (!user) return;
    try {
      const todayStr = getLocalTodayDateString();
      const standup = await api.getTodayStandup(todayStr);
      const isDone = Boolean(standup && (standup.id != null || standup.submittedAt != null));
      setStandupDoneToday(isDone);
    } catch (err) {
      console.error('Failed to check standup status:', err);
    }
  };

  useEffect(() => {
    if (user) {
      checkStandupStatus();
    }
  }, [user]);

  useEffect(() => {
    const handleStandupEvent = () => {
      checkStandupStatus();
    };
    window.addEventListener('jvm_standup_submitted', handleStandupEvent);
    return () => window.removeEventListener('jvm_standup_submitted', handleStandupEvent);
  }, [user]);

  useEffect(() => {
    const handleOpenLab = (e: any) => {
      if (e.detail?.topic) {
        setLabInitialTopic(e.detail.topic);
      }
      handleNavigateTab('interview-lab');
    };
    window.addEventListener('jvm_open_interview_lab', handleOpenLab);
    return () => window.removeEventListener('jvm_open_interview_lab', handleOpenLab);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="font-mono text-xs text-muted flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-accent inline-block"></span>
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isLead = user.role === 'LEAD' || user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        standupDoneToday={standupDoneToday}
        onOpenStandup={() => {
          setGlobalStandupViewOnly(standupDoneToday);
          setGlobalStandupOpen(true);
        }}
        onOpenLeaveEmail={() => setGlobalLeaveEmailOpen(true)}
      />

      <main className="flex-1 pb-20 md:pb-12 min-w-0">
        {activeTab === 'home' && <HomeDashboardPage onNavigateTab={handleNavigateTab} />}
        {activeTab === 'tasks' && <KanbanBoardPage />}
        {activeTab === 'homework' && <HomeworkPage />}
        {activeTab === 'interview-lab' && <InterviewLabPage initialTopic={labInitialTopic} />}
        {activeTab === 'profile' && <MyProfilePage />}
        {activeTab === 'settings' && (
          <AccountSettingsPage
            onNavigateTab={handleNavigateTab}
            onOpenLeaveEmail={() => setGlobalLeaveEmailOpen(true)}
          />
        )}
        {activeTab === 'crew' && <MeetTheCrewPage />}
        {activeTab === 'team' && (isLead ? <TeamDashboardPage /> : <MeetTheCrewPage />)}
      </main>

      <footer className="border-t border-line py-3 bg-paper">
        <div className="max-w-7xl mx-auto px-4 text-center font-mono text-[10px] text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
            <span className="uppercase">{cleanTeamDisplayName(user.teamName) || 'Team'} Workspace</span>
          </div>
          <span>Capture once · Derive everywhere</span>
        </div>
      </footer>

      {/* Unified Global Standup Modal */}
      <DailyStandupModal
        isOpen={globalStandupOpen}
        viewOnly={globalStandupViewOnly}
        initialMode={globalStandupViewOnly ? 'VIEW' : 'WRITE'}
        onClose={() => setGlobalStandupOpen(false)}
        onSuccess={() => {
          setStandupDoneToday(true);
        }}
        onSubmitted={() => {
          setStandupDoneToday(true);
          window.dispatchEvent(new CustomEvent('jvm_standup_submitted'));
        }}
      />

      {/* Global Leave Email Generator Modal */}
      <LeaveEmailModal
        isOpen={globalLeaveEmailOpen}
        onClose={() => setGlobalLeaveEmailOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
