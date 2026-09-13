import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MemberDetailProgress } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ListTodo,
  FileCode,
  Calendar,
  Activity,
} from 'lucide-react';

interface MemberProgressDetailModalProps {
  memberId: number | null;
  onClose: () => void;
}

type TabType = 'overview' | 'tasks' | 'homework' | 'history';

export const MemberProgressDetailModal: React.FC<MemberProgressDetailModalProps> = ({
  memberId,
  onClose,
}) => {
  const [detail, setDetail] = useState<MemberDetailProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!memberId) {
      setDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await api.getMemberDetailProgress(memberId);
        setDetail(data);
      } catch (err) {
        console.error('Failed to load member detail progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [memberId]);

  if (!memberId) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center space-x-1 font-mono text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-sm font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>On Track</span>
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center space-x-1 font-mono text-xs px-2.5 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-sm font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>At Risk</span>
          </span>
        );
      case 'NEEDS_ATTENTION':
      default:
        return (
          <span className="inline-flex items-center space-x-1 font-mono text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-sm font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Needs Attention</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-paper border border-line max-w-4xl w-full rounded-sm shadow-2xl space-y-0 my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-line bg-paper flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-sm bg-accent text-paper font-mono font-bold text-lg flex items-center justify-center shadow-xs">
              {detail ? detail.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display text-lg font-bold text-ink">
                  {detail ? detail.name : 'Loading Member...'}
                </h2>
                {detail && getStatusBadge(detail.status)}
              </div>
              <p className="font-mono text-xs text-muted mt-0.5">
                {detail?.email} · {detail?.teamName} Cohort
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-paper-dark text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex space-x-1 border-b border-line bg-paper-dark px-5 pt-2">
          {(
            [
              { id: 'overview', label: 'Overview & Focus', icon: Activity },
              { id: 'tasks', label: 'Tasks', icon: ListTodo },
              { id: 'homework', label: 'Homework', icon: FileCode },
              { id: 'history', label: 'Activity Log', icon: Calendar },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-2 font-mono text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === tab.id
                    ? 'border-accent text-accent bg-paper font-bold'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading || !detail ? (
            <div className="py-16 text-center text-muted font-mono text-xs space-y-2">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Fetching telemetry data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="p-4 bg-paper-light border border-line rounded-sm space-y-2">
                    <span className="font-mono text-xs font-bold text-muted uppercase">Status Diagnosis</span>
                    <p className="text-sm font-sans font-medium text-ink">{detail.statusReason}</p>
                    <div className="pt-2">
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span className="text-muted">Overall Progress Metric</span>
                        <span className="font-bold text-accent">{detail.overallProgressPct}%</span>
                      </div>
                      <ProgressBar progressPct={detail.overallProgressPct} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-paper border border-line rounded-sm space-y-2">
                      <span className="font-mono text-xs font-bold text-muted uppercase">Kanban Task</span>
                      <span className="text-sm font-bold text-ink block">{detail.currentTask || 'No active task'}</span>
                      <span className="font-mono text-xs text-muted block">
                        Completed {detail.tasksCompletedCount} tasks ({detail.tasksInProgressCount} in progress)
                      </span>
                    </div>

                    <div className="p-4 bg-paper border border-line rounded-sm space-y-2">
                      <span className="font-mono text-xs font-bold text-muted uppercase">Homework & Standup</span>
                      <span className="text-sm font-bold text-ink block">
                        {detail.homeworkSubmittedCount} / {detail.homeworkList?.length || detail.homeworkSubmittedCount} Homework Submitted
                      </span>
                      <span className="font-mono text-xs text-muted block">
                        Today's Standup: {detail.standupSubmittedToday ? 'Submitted ✓' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center font-mono text-xs text-muted border-b border-line pb-2">
                    <span>Kanban Tasks</span>
                    <span>{detail.tasksCompletedCount} Completed</span>
                  </div>

                  {detail.taskList && detail.taskList.length > 0 ? (
                    <div className="space-y-2">
                      {detail.taskList.map((t) => (
                        <div key={t.id} className="p-3 bg-paper-light border border-line rounded-sm space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-ink">{t.title}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-line rounded-sm">{t.status}</span>
                          </div>
                          {t.description && <p className="text-xs text-muted">{t.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted font-mono text-xs">
                      No tasks assigned yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'homework' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center font-mono text-xs text-muted border-b border-line pb-2">
                    <span>Homework Submissions</span>
                    <span>{detail.homeworkSubmittedCount} Submitted</span>
                  </div>

                  {detail.homeworkList && detail.homeworkList.length > 0 ? (
                    <div className="space-y-2">
                      {detail.homeworkList.map((hw) => (
                        <div key={hw.homeworkId} className="p-3 bg-paper-light border border-line rounded-sm space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-ink">{hw.title}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-line rounded-sm">{hw.submissionStatus}</span>
                          </div>
                          <span className="font-mono text-[10px] text-muted block">Subject: {hw.subject} · Due: {hw.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted font-mono text-xs">
                      No homework assigned yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-muted border-b border-line pb-2">
                    Recent Activity Timeline
                  </div>

                  {detail.activityPoints && detail.activityPoints.length > 0 ? (
                    <div className="space-y-3 font-mono text-xs">
                      {detail.activityPoints.map((act, i) => (
                        <div key={i} className="p-3 bg-paper-light border border-line rounded-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="font-semibold text-ink">{act.title}</span>
                            <span className="text-[10px] text-muted">{act.timestamp ? act.timestamp.substring(0, 10) : ''}</span>
                          </div>
                          {act.description && <p className="text-muted font-sans text-[11px]">{act.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted font-mono text-xs">
                      No recent activity.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-paper flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-paper border border-line hover:border-ink rounded-sm text-xs font-mono text-ink font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
