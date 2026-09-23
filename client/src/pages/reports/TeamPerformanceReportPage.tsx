import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  TeamPerformanceReport,
  MemberPerformanceReport,
  ReportPeriodType,
} from '../../types';
import { PageContainer } from '../../components/common/PageContainer';
import {
  FileText,
  FileDown,
  Printer,
  RefreshCw,
  Users,
  Clock,
  AlertTriangle,
  Search,
  ArrowUpDown,
  Download,
  X,
  Sparkles,
  Layers,
  Activity,
  Info,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  ChevronRight,
} from 'lucide-react';

export const TeamPerformanceReportPage: React.FC = () => {
  // Report Period State
  const [periodType, setPeriodType] = useState<ReportPeriodType>('MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Data States
  const [teamReport, setTeamReport] = useState<TeamPerformanceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Download & Export States
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);

  // Table Sorting & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('taskCompletionPct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Member Deep-Dive Modal
  const [inspectMemberModal, setInspectMemberModal] = useState<MemberPerformanceReport | null>(null);

  const fetchTeamReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTeamPerformanceReport(periodType, customStartDate, customEndDate);
      setTeamReport(data);
    } catch (err: any) {
      console.error('Failed to load team performance report:', err);
      setError(err?.message || 'Failed to generate performance report from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamReport();
  }, [periodType, customStartDate, customEndDate]);

  const handleInspectMember = async (memberId: number) => {
    try {
      const data = await api.getMemberPerformanceReport(memberId, periodType, customStartDate, customEndDate);
      setInspectMemberModal(data);
    } catch (err: any) {
      alert('Failed to load member dossier: ' + err.message);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await api.downloadTeamPerformanceReportPdf(periodType, customStartDate, customEndDate);
    } catch (err: any) {
      alert('PDF Generation failed: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      await api.exportTeamPerformanceReportCsv(periodType, customStartDate, customEndDate);
    } catch (err: any) {
      alert('CSV Export failed: ' + err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered & Sorted Member List
  const memberList = teamReport?.memberSummaries || [];
  const filteredMembers = memberList.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.position && m.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedMembers = [...filteredMembers].sort((a: any, b: any) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const periodButtons: { type: ReportPeriodType; label: string }[] = [
    { type: 'DAY', label: 'Today' },
    { type: 'WEEK', label: 'This Week' },
    { type: 'LAST_WEEK', label: 'Last Week' },
    { type: 'MONTH', label: 'This Month' },
    { type: 'LAST_MONTH', label: 'Last Month' },
    { type: 'CUSTOM', label: 'Custom Range' },
  ];

  const totalTasksInPipeline = teamReport?.workflowPipeline.totalCount || 0;
  const getPipelinePct = (count: number) => {
    if (!totalTasksInPipeline) return 0;
    return Math.round((count / totalTasksInPipeline) * 100);
  };

  return (
    <PageContainer width="wide" className="space-y-6 sm:space-y-8 font-sans pb-20">
      {/* ========================================================================= */}
      {/* 1. REPORT HEADER & IDENTITY                                              */}
      {/* ========================================================================= */}
      <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 space-y-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-line/80 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md font-sans text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Performance Intelligence System
              </span>
              <span className="text-muted/40">·</span>
              <span className="font-semibold text-ink text-xs sm:text-sm">{teamReport?.teamName || 'Engineering Team'}</span>
              <span className="text-muted/40">·</span>
              <span className="text-muted text-xs">Cohort {teamReport?.teamCohort || 'Active'}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Team Performance & Intelligence Report
            </h1>

            <p className="text-sm text-muted max-w-2xl">
              Audited, management-grade delivery intelligence derived directly from verified database telemetry.
            </p>
          </div>

          {/* ACTION TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchTeamReport}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-paper hover:bg-paper-dark border border-line hover:border-line-strong rounded-lg text-xs font-medium text-ink transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={exportingCsv || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-paper hover:bg-paper-dark border border-line hover:border-line-strong rounded-lg text-xs font-medium text-ink transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-muted" />
              <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-paper hover:bg-paper-dark border border-line hover:border-line-strong rounded-lg text-xs font-medium text-ink transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-muted" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-4 h-4 text-white/80" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Official PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* 2. REPORT FILTERS: TIME PERIOD & REPORT MODE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          {/* Segmented Period Tabs */}
          <div className="inline-flex p-1 bg-paper-dark/80 rounded-lg border border-line overflow-x-auto no-scrollbar">
            {periodButtons.map((btn) => {
              const active = periodType === btn.type;
              return (
                <button
                  key={btn.type}
                  onClick={() => setPeriodType(btn.type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-paper text-primary shadow-xs font-semibold border border-line/60'
                      : 'text-muted hover:text-ink hover:bg-paper/40'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Metadata string */}
          <div className="text-xs text-muted flex flex-wrap items-center gap-2">
            <span>Lead: <strong className="text-ink font-medium">{teamReport?.currentLeadName || 'Active Lead'}</strong></span>
            <span className="text-muted/40">·</span>
            <span>Period: <strong className="text-ink font-medium">{teamReport?.periodLabel || 'Active'}</strong></span>
            <span className="text-muted/40">·</span>
            <span>Generated: <span className="text-ink font-mono text-[11px]">{teamReport?.generatedAt || 'Today'}</span></span>
          </div>
        </div>

        {/* Custom Date Pickers (when CUSTOM selected) */}
        {periodType === 'CUSTOM' && (
          <div className="p-3.5 bg-paper-light border border-line rounded-lg flex flex-wrap items-center gap-3 text-xs animate-fade-in">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Select Date Range:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted">Start:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-paper border border-line rounded-md text-ink text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">End:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-paper border border-line rounded-md text-ink text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {loading && !teamReport ? (
        <div className="py-24 text-center text-xs text-muted flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-medium text-ink">Aggregating authentic performance data from PostgreSQL...</span>
        </div>
      ) : error && !teamReport ? (
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-xl space-y-3 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-6 h-6 mx-auto text-amber-600" />
          <p className="font-bold text-sm">Report Generation Notice</p>
          <p className="text-xs text-amber-800">{error}</p>
          <button
            onClick={fetchTeamReport}
            className="px-4 py-2 bg-ink text-paper text-xs font-semibold rounded-lg hover:bg-black transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : teamReport && (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
          {/* ========================================================================= */}
          {/* 2. EXECUTIVE BRIEFING & 4-BOX METRIC HERO                                */}
          {/* ========================================================================= */}
          <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  Executive Briefing — {teamReport.periodLabel}
                </h2>
              </div>

              <p className="text-sm sm:text-base text-ink leading-relaxed font-normal bg-paper-light/60 p-4 rounded-lg border border-line/50">
                {teamReport.executiveSummary.executiveSummaryText}
              </p>
            </div>

            {/* 4-Box Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2 shadow-2xs">
                <span className="text-xs text-muted font-medium block">
                  Active Team Members
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-ink">
                    {teamReport.executiveSummary.totalActiveMembers}
                  </span>
                  <span className="text-xs text-muted">enrolled</span>
                </div>
                <div className="text-xs text-muted">
                  Cohort: <strong className="text-ink font-medium">{teamReport.teamCohort}</strong>
                </div>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2 shadow-2xs">
                <span className="text-xs text-muted font-medium block">
                  Task Execution
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-ink">
                    {teamReport.executiveSummary.totalTasksCompleted}
                  </span>
                  <span className="text-xs text-muted">/ {teamReport.executiveSummary.totalTasksAssigned} assigned</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, teamReport.executiveSummary.taskCompletionRatePct)}%` }}
                  />
                </div>
                <span className="text-xs text-primary font-semibold block">
                  {teamReport.executiveSummary.taskCompletionRatePct}% completion rate
                </span>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2 shadow-2xs">
                <span className="text-xs text-muted font-medium block">
                  Standup Compliance
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-ink">
                    {teamReport.executiveSummary.totalStandupsSubmitted}
                  </span>
                  <span className="text-xs text-muted">/ {teamReport.executiveSummary.totalStandupsExpected} expected</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, teamReport.executiveSummary.standupComplianceRatePct)}%` }}
                  />
                </div>
                <span className="text-xs text-accent font-semibold block">
                  {teamReport.executiveSummary.standupComplianceRatePct}% participation rate
                </span>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2 shadow-2xs">
                <span className="text-xs text-muted font-medium block">
                  Homework Submissions
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-ink">
                    {teamReport.executiveSummary.totalHomeworkSubmitted}
                  </span>
                  <span className="text-xs text-muted">submitted</span>
                </div>
                <div className="text-xs text-muted flex items-center justify-between">
                  <span>Reviewed by Lead:</span>
                  <strong className="text-ink font-medium">{teamReport.executiveSummary.totalHomeworkReviewed}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. TEAM HEALTH & OPERATIONAL KPIs                                         */}
          {/* ========================================================================= */}
          <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  Team Health & Operational KPIs
                </h2>
              </div>
              <span className="text-xs text-muted">
                Calculated from verifiable database transactions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-muted">
                  <span>Task Execution Velocity</span>
                  <span className="text-primary font-semibold">{teamReport.teamHealth.taskExecutionPct}%</span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.taskExecutionFormula}
                </div>
                <p className="text-[11px] text-muted">Formula: Completed tasks ÷ assigned tasks in period</p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-muted">
                  <span>Daily Standup Participation</span>
                  <span className="text-accent font-semibold">{teamReport.teamHealth.standupParticipationPct}%</span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.standupParticipationFormula}
                </div>
                <p className="text-[11px] text-muted">Formula: Actual standups ÷ (active members × workdays)</p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-muted">
                  <span>Homework Participation</span>
                  <span className="text-primary font-semibold">{teamReport.teamHealth.homeworkSubmissionPct}%</span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.homeworkSubmissionFormula}
                </div>
                <p className="text-[11px] text-muted">Formula: Submissions ÷ expected cohort assignments</p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-muted">
                  <span>Review Queue Status</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                    teamReport.teamHealth.reviewQueueCount > 0 
                      ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30' 
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {teamReport.teamHealth.reviewQueueCount} PENDING
                  </span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.reviewQueueStatus}
                </div>
                <p className="text-[11px] text-muted">Tasks in review awaiting Lead approval</p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-muted">
                  <span>Active Blockers</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                    teamReport.teamHealth.activeBlockersCount > 0 
                      ? 'bg-red-500/15 text-red-900 border border-red-500/30' 
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {teamReport.teamHealth.activeBlockersCount} OPEN
                  </span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.activeBlockersStatus}
                </div>
                <p className="text-[11px] text-muted">Active blocker issues requiring Lead intervention</p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-muted">
                  <span>Active Member Participation</span>
                  <span className="text-primary font-semibold">100% COHORT</span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.activeParticipationFormula}
                </div>
                <p className="text-[11px] text-muted">Enrolled team members with recorded check-in or task activity</p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. WORKFLOW PIPELINE STAGE DISTRIBUTION                                  */}
          {/* ========================================================================= */}
          <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  Task Workflow Stage Pipeline ({teamReport.workflowPipeline.totalCount} Total)
                </h2>
              </div>
              <span className="text-xs text-muted">
                Live distribution across sprint stages
              </span>
            </div>

            {/* Visual Pipeline Bar */}
            {totalTasksInPipeline > 0 && (
              <div className="w-full h-3 bg-paper-dark rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-line">
                {teamReport.workflowPipeline.backlogCount > 0 && (
                  <div
                    style={{ width: `${getPipelinePct(teamReport.workflowPipeline.backlogCount)}%` }}
                    className="bg-slate-400 h-full rounded-xs transition-all"
                    title={`Backlog: ${teamReport.workflowPipeline.backlogCount}`}
                  />
                )}
                {teamReport.workflowPipeline.todoCount > 0 && (
                  <div
                    style={{ width: `${getPipelinePct(teamReport.workflowPipeline.todoCount)}%` }}
                    className="bg-blue-500 h-full rounded-xs transition-all"
                    title={`To Do: ${teamReport.workflowPipeline.todoCount}`}
                  />
                )}
                {teamReport.workflowPipeline.inProgressCount > 0 && (
                  <div
                    style={{ width: `${getPipelinePct(teamReport.workflowPipeline.inProgressCount)}%` }}
                    className="bg-amber-500 h-full rounded-xs transition-all"
                    title={`In Progress: ${teamReport.workflowPipeline.inProgressCount}`}
                  />
                )}
                {teamReport.workflowPipeline.blockedCount > 0 && (
                  <div
                    style={{ width: `${getPipelinePct(teamReport.workflowPipeline.blockedCount)}%` }}
                    className="bg-rose-500 h-full rounded-xs transition-all"
                    title={`Blocked: ${teamReport.workflowPipeline.blockedCount}`}
                  />
                )}
                {teamReport.workflowPipeline.reviewCount > 0 && (
                  <div
                    style={{ width: `${getPipelinePct(teamReport.workflowPipeline.reviewCount)}%` }}
                    className="bg-purple-500 h-full rounded-xs transition-all"
                    title={`In Review: ${teamReport.workflowPipeline.reviewCount}`}
                  />
                )}
                {teamReport.workflowPipeline.doneCount > 0 && (
                  <div
                    style={{ width: `${getPipelinePct(teamReport.workflowPipeline.doneCount)}%` }}
                    className="bg-emerald-500 h-full rounded-xs transition-all"
                    title={`Completed: ${teamReport.workflowPipeline.doneCount}`}
                  />
                )}
              </div>
            )}

            {/* Pipeline Stage Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3.5 bg-paper-light border border-line rounded-lg">
                <span className="text-[11px] text-muted uppercase font-semibold block">Backlog</span>
                <span className="font-display text-xl font-bold text-ink block">{teamReport.workflowPipeline.backlogCount}</span>
                <span className="text-[11px] text-muted block">{teamReport.workflowPipeline.backlogPct}%</span>
              </div>
              <div className="p-3.5 bg-paper-light border border-line rounded-lg">
                <span className="text-[11px] text-muted uppercase font-semibold block">To Do</span>
                <span className="font-display text-xl font-bold text-ink block">{teamReport.workflowPipeline.todoCount}</span>
                <span className="text-[11px] text-muted block">{teamReport.workflowPipeline.todoPct}%</span>
              </div>
              <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                <span className="text-[11px] text-amber-400 uppercase font-semibold block">In Progress</span>
                <span className="font-display text-xl font-bold text-amber-300 block">{teamReport.workflowPipeline.inProgressCount}</span>
                <span className="text-[11px] text-amber-400/80 block">{teamReport.workflowPipeline.inProgressPct}%</span>
              </div>
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-lg">
                <span className="text-[11px] text-rose-400 uppercase font-semibold block">Blocked</span>
                <span className="font-display text-xl font-bold text-rose-300 block">{teamReport.workflowPipeline.blockedCount}</span>
                <span className="text-[11px] text-rose-400/80 block">{teamReport.workflowPipeline.blockedPct}%</span>
              </div>
              <div className="p-3.5 bg-purple-500/15 border border-purple-500/30 rounded-lg">
                <span className="text-[11px] text-purple-400 uppercase font-semibold block">In Review</span>
                <span className="font-display text-xl font-bold text-purple-300 block">{teamReport.workflowPipeline.reviewCount}</span>
                <span className="text-[11px] text-purple-400/80 block">{teamReport.workflowPipeline.reviewPct}%</span>
              </div>
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg">
                <span className="text-[11px] text-emerald-400 uppercase font-semibold block">Completed</span>
                <span className="font-display text-xl font-bold text-emerald-300 block">{teamReport.workflowPipeline.doneCount}</span>
                <span className="text-[11px] text-emerald-400/80 block">{teamReport.workflowPipeline.donePct}%</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. MEMBER-BY-MEMBER PERFORMANCE MATRIX                                   */}
          {/* ========================================================================= */}
          <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-paper-dark/40">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                    Member-by-Member Performance Matrix
                  </h2>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Factual deliverable counts for all {teamReport.memberSummaries.length} enrolled team members
                </p>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by name, serial, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-64"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper-light border-b border-line text-muted uppercase text-[11px] font-semibold">
                    <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:text-ink transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span>Member</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('taskCompletionPct')} className="p-4 text-center cursor-pointer hover:text-ink transition-colors">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Tasks Done</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="p-4 text-center">Homework</th>
                    <th onClick={() => handleSort('standupConsistencyPct')} className="p-4 text-center cursor-pointer hover:text-ink transition-colors">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Standups</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="p-4 text-center">Workload Status</th>
                    <th className="p-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sortedMembers.map((m) => (
                    <tr
                      key={m.userId}
                      onClick={() => handleInspectMember(m.userId)}
                      className="hover:bg-paper-light/70 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-ink text-sm group-hover:text-primary transition-colors">{m.name}</span>
                              {m.isCurrentLead && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-md">
                                  LEAD
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted font-mono">{m.serialNumber} · {m.position || 'Engineer'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-semibold text-ink text-sm block">{m.tasksCompleted} / {m.tasksAssigned}</span>
                        <span className="text-xs text-primary font-medium block">{m.taskCompletionPct}% rate</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-semibold text-ink text-sm block">{m.homeworkSubmitted} submitted</span>
                        <span className="text-xs text-muted block">{m.homeworkReviewed} reviewed</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-semibold text-ink text-sm block">{m.standupsSubmitted} / {m.standupsExpected}</span>
                        <span className="text-xs text-accent font-medium block">{m.standupConsistencyPct}% rate</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-block text-xs font-medium text-ink px-2.5 py-1 bg-paper-dark border border-line rounded-md">
                          {m.workloadStatus}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectMember(m.userId);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line hover:border-line-strong rounded-lg text-xs font-semibold text-ink transition-colors shadow-2xs cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-line">
              {sortedMembers.map((m) => (
                <div
                  key={m.userId}
                  onClick={() => handleInspectMember(m.userId)}
                  className="p-4 space-y-3 hover:bg-paper-light/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-ink text-sm block">{m.name}</span>
                        <span className="text-xs text-muted font-mono">{m.serialNumber}</span>
                      </div>
                    </div>
                    {m.isCurrentLead && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-md">
                        LEAD
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-paper-light p-2.5 rounded-lg border border-line">
                    <div>
                      <span className="text-[10px] text-muted uppercase block">Tasks</span>
                      <span className="font-bold text-ink">{m.tasksCompleted}/{m.tasksAssigned}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase block">HW</span>
                      <span className="font-bold text-ink">{m.homeworkSubmitted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase block">Standups</span>
                      <span className="font-bold text-ink">{m.standupsSubmitted}/{m.standupsExpected}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectMember(m.userId);
                      }}
                      className="w-full py-2 bg-paper hover:bg-paper-dark border border-line rounded-lg text-xs font-semibold text-ink text-center transition-colors"
                    >
                      Inspect Member Dossier →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. DATA-DERIVED MANAGEMENT INSIGHTS                                      */}
          {/* ========================================================================= */}
          <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                Data-Derived Management Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamReport.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-paper-light border border-line rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase text-[10px] px-2 py-0.5 bg-paper-dark text-muted border border-line rounded-md">
                      {insight.category.replace('_', ' ')}
                    </span>
                    <span className="text-primary font-medium text-xs">{insight.supportingData}</span>
                  </div>
                  <h3 className="font-semibold text-ink text-sm">{insight.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{insight.insightText}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. ACTIONABLE AREAS REQUIRING ATTENTION                                  */}
          {/* ========================================================================= */}
          {teamReport.attentionAreas.length > 0 && (
            <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  Areas Requiring Attention ({teamReport.attentionAreas.length})
                </h2>
              </div>

              <div className="divide-y divide-line">
                {teamReport.attentionAreas.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm">{item.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-semibold ${
                          item.severity === 'HIGH' 
                            ? 'bg-rose-500/10 text-rose-800 border border-rose-500/25' 
                            : 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
                        }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>

                    <span className="text-xs text-primary font-semibold shrink-0 bg-primary/5 px-2.5 py-1 rounded-md border border-primary/20">
                      {item.actionPrompt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. REPORTING METHODOLOGY & DATA INTEGRITY NOTICE                          */}
          {/* ========================================================================= */}
          <div className="p-5 bg-paper-light/60 border border-line rounded-xl text-xs text-muted space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <Info className="w-4 h-4 text-primary" />
              <span>Reporting Methodology & Verification Policy</span>
            </div>
            <p className="leading-relaxed">
              {teamReport.methodology.statementOfFact}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
              <div>
                <span className="text-ink font-semibold block mb-1">Audited PostgreSQL Sources:</span>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  {teamReport.methodology.dataSources.map((ds, idx) => (
                    <li key={idx}>{ds}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-ink font-semibold block mb-1">Calculation Rules:</span>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  {teamReport.methodology.calculationRules.map((cr, idx) => (
                    <li key={idx}>{cr}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. INDIVIDUAL MEMBER REPORT DEEP-DIVE MODAL / DOSSIER                     */}
      {/* ========================================================================= */}
      {inspectMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-paper border border-line rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-6 shadow-xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-base flex items-center justify-center">
                  {inspectMemberModal.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-ink">
                      {inspectMemberModal.name}
                    </h2>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 bg-paper-dark border border-line rounded-md">
                      {inspectMemberModal.serialNumber}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {inspectMemberModal.position || 'Team Member'} · {inspectMemberModal.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectMemberModal(null)}
                className="p-2 rounded-lg hover:bg-paper-dark text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Deliverables 4-Card Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 bg-paper-light border border-line rounded-xl">
                <span className="text-[11px] text-muted font-medium block">Tasks Done</span>
                <span className="font-display text-xl font-bold text-ink block">{inspectMemberModal.tasksCompleted} / {inspectMemberModal.tasksAssigned}</span>
                <span className="text-xs text-primary font-semibold block">{inspectMemberModal.taskCompletionPct}% Rate</span>
              </div>
              <div className="p-3.5 bg-paper-light border border-line rounded-xl">
                <span className="text-[11px] text-muted font-medium block">Homework</span>
                <span className="font-display text-xl font-bold text-ink block">{inspectMemberModal.homeworkSubmitted}</span>
                <span className="text-xs text-muted block">{inspectMemberModal.homeworkReviewed} Reviewed</span>
              </div>
              <div className="p-3.5 bg-paper-light border border-line rounded-xl">
                <span className="text-[11px] text-muted font-medium block">Standups</span>
                <span className="font-display text-xl font-bold text-ink block">{inspectMemberModal.standupsSubmitted} / {inspectMemberModal.standupsExpected}</span>
                <span className="text-xs text-accent font-semibold block">{inspectMemberModal.standupConsistencyPct}% Rate</span>
              </div>
              <div className="p-3.5 bg-paper-light border border-line rounded-xl">
                <span className="text-[11px] text-muted font-medium block">Current Streak</span>
                <span className="font-display text-xl font-bold text-ink block">{inspectMemberModal.currentStreakDays} Days</span>
                <span className="text-xs text-muted block">Standup Streak</span>
              </div>
            </div>

            {/* Member Insights */}
            {inspectMemberModal.memberInsights.length > 0 && (
              <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider block">Factual Activity Insights:</span>
                <ul className="space-y-1.5 text-xs text-muted">
                  {inspectMemberModal.memberInsights.map((ins, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong className="text-ink font-medium">{ins.title}:</strong> {ins.insightText}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chronological Activity Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  Chronological Activity Timeline ({inspectMemberModal.activityTimeline.length} Events)
                </h3>
              </div>

              {inspectMemberModal.activityTimeline.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted border border-dashed border-line rounded-xl">
                  No recorded activity transactions for this member in the selected period.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {inspectMemberModal.activityTimeline.map((ev, idx) => (
                    <div key={idx} className="p-3 bg-paper-light border border-line rounded-lg flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{ev.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-paper-dark border border-line rounded-md uppercase">
                            {ev.statusBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">{ev.description}</p>
                      </div>
                      <span className="text-xs text-muted font-mono shrink-0">{ev.formattedDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-line flex justify-end">
              <button
                onClick={() => setInspectMemberModal(null)}
                className="px-5 py-2 bg-ink hover:bg-black text-paper rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
