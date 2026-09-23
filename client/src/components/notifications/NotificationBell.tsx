// NotificationBell.tsx - Production In-App Notification Bell & Web Push Center
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { pushService, PushPermissionStatus } from '../../services/pushNotificationService';
import { WorkspaceNotification } from '../../types';
import {
  Bell,
  Check,
  CheckSquare,
  Sparkles,
  Terminal,
  Users,
  Settings,
  Loader2,
  BellRing,
  Video,
} from 'lucide-react';

interface NotificationBellProps {
  onNavigate?: (tab: string, entityId?: number) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('DEFAULT');
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and sync push subscription
  useEffect(() => {
    fetchUnreadCount();
    checkPushStatus();
    pushService.syncExistingSubscription();

    // Periodic gentle refresh for unread count (60s)
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Non-critical background failure
    }
  };

  const checkPushStatus = async () => {
    const status = await pushService.getStatus();
    setPermissionStatus(status);
  };

  const handleOpenPanel = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setLoading(true);
      try {
        const data = await api.getNotifications(0, 20);
        setNotifications(data.content || []);
        fetchUnreadCount();
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif: WorkspaceNotification) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    setIsOpen(false);

    // Route to appropriate tab / view
    if (onNavigate) {
      if (notif.type.startsWith('TASK')) {
        onNavigate('tasks', notif.entityId);
      } else if (notif.type.startsWith('HOMEWORK')) {
        onNavigate('homework', notif.entityId);
      } else if (notif.type.startsWith('STANDUP')) {
        onNavigate('team', notif.entityId);
      } else if (notif.type.includes('MEETING')) {
        onNavigate('meetings', notif.entityId);
      } else {
        onNavigate('home', notif.entityId);
      }
    }
  };

  const handleEnablePush = async () => {
    setEnablingPush(true);
    setPushStatusMessage(null);
    try {
      const result = await pushService.subscribeToPush();
      setPushStatusMessage(result.message);
      await checkPushStatus();
    } catch (err: any) {
      setPushStatusMessage(err.message || 'Failed to enable push notifications');
    } finally {
      setEnablingPush(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const renderIcon = (type: string) => {
    if (type.includes('MEETING')) {
      return <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
    if (type.startsWith('TASK')) {
      return <CheckSquare className="w-3.5 h-3.5 text-accent shrink-0" />;
    }
    if (type.startsWith('HOMEWORK')) {
      return <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
    if (type.startsWith('STANDUP')) {
      return <Terminal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
    return <Users className="w-3.5 h-3.5 text-muted shrink-0" />;
  };

  return (
    <div className="relative shrink-0" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleOpenPanel}
        className={`relative w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-sm border flex items-center justify-center transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'bg-paper-dark border-ink/40 text-ink ring-1 ring-ink/10'
            : 'bg-paper border-line text-muted hover:text-ink hover:border-ink/40 hover:bg-paper-dark/60'
        }`}
        title="Notifications & Alerts"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-accent text-white font-mono font-bold text-[9px] flex items-center justify-center rounded-full shadow-xs ring-2 ring-paper animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop for click-outside dismissal */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] max-w-[calc(100vw-24px)] bg-paper border border-line rounded-sm shadow-2xl py-0 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-line bg-paper-dark/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-xs sm:text-sm text-ink uppercase tracking-tight">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="font-mono text-[10px] font-bold bg-accent/15 text-accent border border-accent/30 px-1.5 py-0.2 rounded-xs">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-mono text-muted hover:text-accent flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Push Permission Callout (if not yet granted or subscribed) */}
            {permissionStatus === 'DEFAULT' && (
              <div className="p-3 bg-paper-dark/30 border-b border-line flex items-start space-x-2.5">
                <div className="w-7 h-7 bg-accent/10 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                  <BellRing className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink">Enable Web Push Notifications</p>
                  <p className="text-[10px] text-muted leading-tight mt-0.5">
                    Receive task and homework alerts even when this tab is closed.
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={enablingPush}
                      onClick={handleEnablePush}
                      className="px-2.5 py-1 bg-ink text-paper text-[10px] font-mono font-bold rounded-xs hover:bg-ink-light transition-colors flex items-center space-x-1 disabled:opacity-60 cursor-pointer"
                    >
                      {enablingPush ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-accent" />
                          <span>Activating...</span>
                        </>
                      ) : (
                        <span>Enable Push</span>
                      )}
                    </button>
                    {pushStatusMessage && (
                      <span className="text-[10px] text-muted truncate max-w-[150px]">
                        {pushStatusMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-line/60 max-h-[360px]">
              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-2 text-muted">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <span className="font-mono text-xs">Loading updates...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 text-muted">
                  <div className="w-10 h-10 bg-paper-dark rounded-full mx-auto flex items-center justify-center border border-line">
                    <Bell className="w-5 h-5 text-muted/60" />
                  </div>
                  <p className="text-xs font-semibold text-ink">No notifications yet</p>
                  <p className="font-mono text-[11px] text-muted max-w-xs mx-auto">
                    When tasks are assigned, homework published, or standups submitted, alerts will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 sm:p-3.5 transition-colors cursor-pointer flex items-start space-x-3 hover:bg-paper-dark/60 ${
                      !n.isRead ? 'bg-accent-subtle/25' : 'bg-paper'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="w-6 h-6 rounded-sm bg-paper-dark border border-line flex items-center justify-center">
                        {renderIcon(n.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-ink font-bold' : 'text-ink'}`}>
                          {n.title}
                        </p>
                        <span className="font-mono text-[10px] text-muted whitespace-nowrap shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                    </div>

                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5 ring-2 ring-accent/20" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-line bg-paper-dark/30 flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted">Standards Web Push</span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('settings');
                  }}
                  className="text-accent hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Preferences</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
