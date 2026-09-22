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
      alert('Failed to load member report: ' + err.message);
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
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <PageContainer width="wide" className="space-y-6 sm:space-y-8 font-sans pb-16">
      {/* ========================================================================= */}
      {/* 1. REPORT HEADER & IDENTITY                                              */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper p-5 sm:p-6 rounded-sm space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-0.5 bg-accent-subtle text-accent border border-accent/30 rounded-xs font-bold uppercase">
                ENGINEERSPACE REPORTING SYSTEM
              </span>
              <span className="text-muted">·</span>
              <span className="font-bold text-ink">{teamReport?.teamName || 'Team'}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">Cohort: {teamReport?.teamCohort || 'Active'}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight">
              Team Performance & Progress Intelligence
            </h1>

            <p className="font-mono text-xs text-muted">
              Factual, management-grade delivery intelligence derived directly from PostgreSQL.
            </p>
          </div>

          {/* ACTION TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={fetchTeamReport}
              disabled={loading}
              className="p-2 bg-paper border border-line hover:border-ink rounded-xs text-muted hover:text-ink transition-colors flex items-center space-x-1.5 shadow-2xs"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={exportingCsv || loading}
              className="px-3 py-2 bg-paper border border-line hover:border-ink rounded-xs font-bold text-ink transition-colors flex items-center space-x-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-muted" />
              <span>{exportingCsv ? 'EXPORTING...' : 'EXPORT CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-paper border border-line hover:border-ink rounded-xs font-bold text-ink transition-colors flex items-center space-x-1.5 shadow-2xs hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 text-muted" />
              <span>PRINT</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xs font-bold transition-all duration-160 shadow-xs flex items-center space-x-2 cursor-pointer hover:-translate-y-[1px] active:translate-y-0"
            >
              <FileDown className="w-4 h-4 text-emerald-200" />
              <span>{downloadingPdf ? 'GENERATING PDF...' : 'OFFICIAL PDF REPORT'}</span>
            </button>
          </div>
        </div>

        {/* 2. REPORT FILTERS: TIME PERIOD & REPORT MODE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs pt-1">
          {/* Period Selector Tabs */}
          <div className="flex items-center space-x-1 bg-paper-dark p-1 rounded-xs border border-line overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setPeriodType('DAY')}
              className={`px-3 py-1.5 rounded-xs font-bold transition-colors shrink-0 ${
                periodType === 'DAY' ? 'bg-paper-light text-primary shadow-2xs border border-primary/20' : 'text-muted hover:text-ink hover:bg-paper-light/60'
              }`}
            >
              TODAY
            </button>
            <button
              onClick={() => setPeriodType('WEEK')}
              className={`px-3 py-1.5 rounded-xs font-bold transition-colors shrink-0 ${
                periodType === 'WEEK' ? 'bg-paper-light text-primary shadow-2xs border border-primary/20' : 'text-muted hover:text-ink hover:bg-paper-light/60'
              }`}
            >
              THIS WEEK
            </button>
            <button
              onClick={() => setPeriodType('LAST_WEEK')}
              className={`px-3 py-1.5 rounded-xs font-bold transition-colors shrink-0 ${
                periodType === 'LAST_WEEK' ? 'bg-paper-light text-primary shadow-2xs border border-primary/20' : 'text-muted hover:text-ink hover:bg-paper-light/60'
              }`}
            >
              LAST WEEK
            </button>
            <button
              onClick={() => setPeriodType('MONTH')}
              className={`px-3 py-1.5 rounded-xs font-bold transition-colors shrink-0 ${
                periodType === 'MONTH' ? 'bg-paper-light text-primary shadow-2xs border border-primary/20' : 'text-muted hover:text-ink hover:bg-paper-light/60'
              }`}
            >
              THIS MONTH
            </button>
            <button
              onClick={() => setPeriodType('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-xs font-bold transition-colors shrink-0 ${
                periodType === 'LAST_MONTH' ? 'bg-paper-light text-primary shadow-2xs border border-primary/20' : 'text-muted hover:text-ink hover:bg-paper-light/60'
              }`}
            >
              LAST MONTH
            </button>
            <button
              onClick={() => setPeriodType('CUSTOM')}
              className={`px-3 py-1.5 rounded-xs font-bold transition-colors shrink-0 ${
                periodType === 'CUSTOM' ? 'bg-paper-light text-primary shadow-2xs border border-primary/20' : 'text-muted hover:text-ink hover:bg-paper-light/60'
              }`}
            >
              CUSTOM RANGE
            </button>
          </div>

          {/* Metadata String */}
          <div className="text-muted text-[11px] flex items-center space-x-2 self-start md:self-auto">
            <span>Lead: <strong className="text-ink">{teamReport?.currentLeadName}</strong></span>
            <span>·</span>
            <span>Generated: <strong className="text-ink">{teamReport?.generatedAt}</strong></span>
          </div>
        </div>

        {/* Custom Date Pickers (when CUSTOM selected) */}
        {periodType === 'CUSTOM' && (
          <div className="p-3 bg-paper-dark/60 border border-line rounded-xs flex flex-wrap items-center gap-3 font-mono text-xs animate-fade-in">
            <span className="font-bold text-ink">Custom Date Range:</span>
            <div className="flex items-center space-x-2">
              <span className="text-muted">Start:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-paper border border-line rounded-xs text-ink outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted">End:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-paper border border-line rounded-xs text-ink outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {loading && !teamReport ? (
        <div className="py-20 text-center font-mono text-xs text-muted flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span>Deriving authentic performance telemetry from PostgreSQL...</span>
        </div>
      ) : error && !teamReport ? (
        <div className="p-6 bg-attention-subtle border border-attention/30 text-attention text-xs rounded-sm space-y-3 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-6 h-6 mx-auto text-attention" />
          <p className="font-bold">Report Generation Error</p>
          <p className="font-mono text-[11px]">{error}</p>
          <button
            onClick={fetchTeamReport}
            className="px-4 py-2 bg-ink text-paper font-mono font-bold rounded-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : teamReport && (
        <div className="space-y-8 animate-fade-in">
          {/* ========================================================================= */}
          {/* 2. EXECUTIVE BRIEFING & 4-BOX METRIC GRID                                 */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="border border-line bg-paper p-5 sm:p-6 rounded-sm space-y-4 shadow-2xs">
              <div className="flex items-center space-x-2 font-mono text-xs border-b border-line pb-2.5 text-muted uppercase font-bold tracking-wider">
                <FileText className="w-4 h-4 text-accent" />
                <span>EXECUTIVE BRIEFING — {teamReport.periodLabel.toUpperCase()}</span>
              </div>

              <p className="text-sm text-ink leading-relaxed font-normal">
                {teamReport.executiveSummary.executiveSummaryText}
              </p>

              {/* 4-Box Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-4 bg-paper-light border border-line rounded-sm space-y-1 shadow-2xs">
                  <span className="font-mono text-[10px] text-muted font-bold uppercase block">
                    ACTIVE MEMBERS
                  </span>
                  <span className="font-display text-2xl font-black text-ink block">
                    {teamReport.executiveSummary.totalActiveMembers}
                  </span>
                  <span className="font-mono text-[10px] text-muted block">
                    {teamReport.teamName}
                  </span>
                </div>

                <div className="p-4 bg-paper-light border border-line rounded-sm space-y-1 shadow-2xs">
                  <span className="font-mono text-[10px] text-muted font-bold uppercase block">
                    TASK EXECUTION
                  </span>
                  <span className="font-display text-2xl font-black text-ink block">
                    {teamReport.executiveSummary.totalTasksCompleted} / {teamReport.executiveSummary.totalTasksAssigned}
                  </span>
                  <span className="font-mono text-[10px] text-accent font-bold block">
                    {teamReport.executiveSummary.taskCompletionRatePct}% completion rate
                  </span>
                </div>

                <div className="p-4 bg-paper-light border border-line rounded-sm space-y-1 shadow-2xs">
                  <span className="font-mono text-[10px] text-muted font-bold uppercase block">
                    STANDUP COMPLIANCE
                  </span>
                  <span className="font-display text-2xl font-black text-ink block">
                    {teamReport.executiveSummary.totalStandupsSubmitted} / {teamReport.executiveSummary.totalStandupsExpected}
                  </span>
                  <span className="font-mono text-[10px] text-accent font-bold block">
                    {teamReport.executiveSummary.standupComplianceRatePct}% participation rate
                  </span>
                </div>

                <div className="p-4 bg-paper-light border border-line rounded-sm space-y-1 shadow-2xs">
                  <span className="font-mono text-[10px] text-muted font-bold uppercase block">
                    HOMEWORK SUBMISSIONS
                  </span>
                  <span className="font-display text-2xl font-black text-ink block">
                    {teamReport.executiveSummary.totalHomeworkSubmitted}
                  </span>
                  <span className="font-mono text-[10px] text-muted block">
                    {teamReport.executiveSummary.totalHomeworkReviewed} reviewed by Lead
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. TEAM HEALTH OVERVIEW (TRANSPARENT MEASURABLE INDICATORS)                */}
          {/* ========================================================================= */}
          <div className="border border-line bg-paper p-5 sm:p-6 rounded-sm space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-accent" />
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  TEAM HEALTH & OPERATIONAL KPIs
                </h2>
              </div>
              <span className="font-mono text-[11px] text-muted">
                Calculated from verifiable database transactions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 bg-paper-light border border-line rounded-xs space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>Task Execution Velocity</span>
                  <span className="text-accent">{teamReport.teamHealth.taskExecutionPct}%</span>
                </div>
                <div className="font-display text-lg font-bold text-ink">
                  {teamReport.teamHealth.taskExecutionFormula}
                </div>
                <p className="text-[10px] text-muted">Formula: Completed tasks ÷ assigned tasks in period</p>
              </div>

              <div className="p-3.5 bg-paper-light border border-line rounded-xs space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>Daily Standup Participation</span>
                  <span className="text-accent">{teamReport.teamHealth.standupParticipationPct}%</span>
                </div>
                <div className="font-display text-lg font-bold text-ink">
                  {teamReport.teamHealth.standupParticipationFormula}
                </div>
                <p className="text-[10px] text-muted">Formula: Actual standups ÷ (active members × workdays)</p>
              </div>

              <div className="p-3.5 bg-paper-light border border-line rounded-xs space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>Homework Participation</span>
                  <span className="text-accent">{teamReport.teamHealth.homeworkSubmissionPct}%</span>
                </div>
                <div className="font-display text-lg font-bold text-ink">
                  {teamReport.teamHealth.homeworkSubmissionFormula}
                </div>
                <p className="text-[10px] text-muted">Formula: Submissions ÷ expected cohort assignments</p>
              </div>

              <div className="p-3.5 bg-paper-light border border-line rounded-xs space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>Review Queue Status</span>
                  <span className={teamReport.teamHealth.reviewQueueCount > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700'}>
                    {teamReport.teamHealth.reviewQueueCount} PENDING
                  </span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.reviewQueueStatus}
                </div>
                <p className="text-[10px] text-muted">Tasks with status REVIEW awaiting Lead approval</p>
              </div>

              <div className="p-3.5 bg-paper-light border border-line rounded-xs space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>Active Blockers</span>
                  <span className={teamReport.teamHealth.activeBlockersCount > 0 ? 'text-red-700 font-bold' : 'text-emerald-700'}>
                    {teamReport.teamHealth.activeBlockersCount} OPEN
                  </span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.activeBlockersStatus}
                </div>
                <p className="text-[10px] text-muted">Active blocker issues requiring Lead intervention</p>
              </div>

              <div className="p-3.5 bg-paper-light border border-line rounded-xs space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>Active Member Participation</span>
                  <span className="text-emerald-700 font-bold">100% COHORT</span>
                </div>
                <div className="font-display text-base font-bold text-ink">
                  {teamReport.teamHealth.activeParticipationFormula}
                </div>
                <p className="text-[10px] text-muted">Enrolled team members with recorded check-in or task activity</p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. WORKFLOW PIPELINE STAGE DISTRIBUTION                                  */}
          {/* ========================================================================= */}
          <div className="border border-line bg-paper p-5 sm:p-6 rounded-sm space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-accent" />
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  TASK WORKFLOW STAGE PIPELINE ({teamReport.workflowPipeline.totalCount} TOTAL)
                </h2>
              </div>
              <span className="font-mono text-[11px] text-muted">
                Live distribution across sprint stages
              </span>
            </div>

            {/* Pipeline Stage Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center font-mono text-xs">
              <div className="p-3 bg-paper-light border border-line rounded-xs">
                <span className="text-[10px] text-muted uppercase font-bold block">BACKLOG</span>
                <span className="font-display text-xl font-black text-ink block">{teamReport.workflowPipeline.backlogCount}</span>
                <span className="text-[10px] text-muted block">{teamReport.workflowPipeline.backlogPct}%</span>
              </div>
              <div className="p-3 bg-paper-light border border-line rounded-xs">
                <span className="text-[10px] text-muted uppercase font-bold block">ASSIGNED / TO DO</span>
                <span className="font-display text-xl font-black text-ink block">{teamReport.workflowPipeline.todoCount}</span>
                <span className="text-[10px] text-muted block">{teamReport.workflowPipeline.todoPct}%</span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xs">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">IN PROGRESS</span>
                <span className="font-display text-xl font-black text-amber-950 block">{teamReport.workflowPipeline.inProgressCount}</span>
                <span className="text-[10px] text-amber-800 block">{teamReport.workflowPipeline.inProgressPct}%</span>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xs">
                <span className="text-[10px] text-red-800 uppercase font-bold block">BLOCKED</span>
                <span className="font-display text-xl font-black text-red-950 block">{teamReport.workflowPipeline.blockedCount}</span>
                <span className="text-[10px] text-red-800 block">{teamReport.workflowPipeline.blockedPct}%</span>
              </div>
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xs">
                <span className="text-[10px] text-amber-900 uppercase font-bold block">IN REVIEW</span>
                <span className="font-display text-xl font-black text-amber-950 block">{teamReport.workflowPipeline.reviewCount}</span>
                <span className="text-[10px] text-amber-900 block">{teamReport.workflowPipeline.reviewPct}%</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xs">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">COMPLETED</span>
                <span className="font-display text-xl font-black text-emerald-950 block">{teamReport.workflowPipeline.doneCount}</span>
                <span className="text-[10px] text-emerald-800 block">{teamReport.workflowPipeline.donePct}%</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. MEMBER-BY-MEMBER PERFORMANCE MATRIX                                   */}
          {/* ========================================================================= */}
          <div className="border border-line bg-paper rounded-sm overflow-hidden shadow-2xs space-y-0">
            <div className="p-4 sm:p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper-dark">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                    MEMBER-BY-MEMBER PERFORMANCE MATRIX
                  </h2>
                </div>
                <p className="font-mono text-[11px] text-muted mt-0.5">
                  Factual deliverable counts for all {teamReport.memberSummaries.length} enrolled members
                </p>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-paper border border-line rounded-xs text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-accent w-full sm:w-56"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-paper-light border-b border-line text-muted uppercase text-[10px]">
                    <th onClick={() => handleSort('name')} className="p-3.5 cursor-pointer hover:text-ink">
                      <div className="flex items-center space-x-1">
                        <span>Member</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('taskCompletionPct')} className="p-3.5 text-center cursor-pointer hover:text-ink">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Tasks Done</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3.5 text-center">Homework</th>
                    <th onClick={() => handleSort('standupConsistencyPct')} className="p-3.5 text-center cursor-pointer hover:text-ink">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Standups</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3.5 text-center">Workload Status</th>
                    <th className="p-3.5 text-right">Inspect Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-sans">
                  {sortedMembers.map((m) => (
                    <tr
                      key={m.userId}
                      onClick={() => handleInspectMember(m.userId)}
                      className="hover:bg-paper-dark/40 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xs bg-ink text-paper font-mono font-bold text-xs flex items-center justify-center">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-ink text-xs">{m.name}</span>
                              {m.isCurrentLead && (
                                <span className="font-mono text-[9px] font-bold px-1 py-0.2 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-xs">
                                  LEAD
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-muted">{m.serialNumber} · {m.position}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="font-bold text-ink block">{m.tasksCompleted} / {m.tasksAssigned}</span>
                        <span className="text-[10px] text-accent font-semibold block">{m.taskCompletionPct}% rate</span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="font-bold text-ink block">{m.homeworkSubmitted} submitted</span>
                        <span className="text-[10px] text-muted block">{m.homeworkReviewed} reviewed</span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="font-bold text-ink block">{m.standupsSubmitted} / {m.standupsExpected}</span>
                        <span className="text-[10px] text-accent font-semibold block">{m.standupConsistencyPct}%</span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="text-xs font-semibold text-ink px-2 py-0.5 bg-paper-dark border border-line rounded-xs">
                          {m.workloadStatus}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectMember(m.userId);
                          }}
                          className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-xs text-xs font-bold text-ink transition-colors"
                        >
                          View Dossier →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-line font-sans">
              {sortedMembers.map((m) => (
                <div
                  key={m.userId}
                  onClick={() => handleInspectMember(m.userId)}
                  className="p-4 space-y-3 hover:bg-paper-dark/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xs bg-ink text-paper font-mono font-bold text-xs flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-ink text-xs block">{m.name}</span>
                        <span className="font-mono text-[10px] text-muted block">{m.serialNumber}</span>
                      </div>
                    </div>
                    {m.isCurrentLead && (
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-xs">
                        LEAD
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px] bg-paper-dark/40 p-2 rounded-xs border border-line">
                    <div>
                      <span className="text-[9px] text-muted uppercase block">Tasks</span>
                      <span className="font-bold text-ink">{m.tasksCompleted}/{m.tasksAssigned}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted block uppercase">HW</span>
                      <span className="font-bold text-ink">{m.homeworkSubmitted}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted block uppercase">Standups</span>
                      <span className="font-bold text-ink">{m.standupsSubmitted}/{m.standupsExpected}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectMember(m.userId);
                      }}
                      className="w-full py-1.5 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-bold text-ink text-center"
                    >
                      Inspect Member Performance →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. DATA-DERIVED MANAGEMENT INSIGHTS ("WHAT THE DATA SHOWS")              */}
          {/* ========================================================================= */}
          <div className="border border-line bg-paper p-5 sm:p-6 rounded-sm space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-line pb-2.5">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                DATA-DERIVED MANAGEMENT INSIGHTS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamReport.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-paper-light border border-line rounded-xs space-y-1.5 font-sans">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold uppercase px-1.5 py-0.2 bg-paper-dark text-muted border border-line rounded-xs">
                      {insight.category.replace('_', ' ')}
                    </span>
                    <span className="text-accent font-semibold">{insight.supportingData}</span>
                  </div>
                  <h3 className="font-bold text-ink text-xs">{insight.title}</h3>
                  <p className="text-xs text-muted leading-relaxed font-normal">{insight.insightText}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. ACTIONABLE AREAS REQUIRING ATTENTION                                  */}
          {/* ========================================================================= */}
          {teamReport.attentionAreas.length > 0 && (
            <div className="border border-line bg-paper p-5 sm:p-6 rounded-sm space-y-4 shadow-2xs">
              <div className="flex items-center space-x-2 border-b border-line pb-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  AREAS REQUIRING ATTENTION ({teamReport.attentionAreas.length})
                </h2>
              </div>

              <div className="divide-y divide-line">
                {teamReport.attentionAreas.map((item, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-ink text-xs">{item.title}</span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-xs uppercase font-bold ${
                          item.severity === 'HIGH' ? 'bg-red-500/10 text-red-700 border border-red-500/30' : 'bg-amber-500/10 text-amber-800 border border-amber-500/30'
                        }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>

                    <span className="font-mono text-xs text-accent font-semibold shrink-0">
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
          <div className="p-4 bg-paper-dark/40 border border-line rounded-xs font-mono text-[11px] text-muted space-y-2">
            <div className="flex items-center space-x-1.5 text-ink font-bold uppercase">
              <Info className="w-3.5 h-3.5 text-accent" />
              <span>Reporting Methodology & Defensibility</span>
            </div>
            <p className="leading-relaxed">
              {teamReport.methodology.statementOfFact}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[10px]">
              <div>
                <span className="text-ink font-bold block">Audited PostgreSQL Sources:</span>
                <ul className="list-disc list-inside space-y-0.5 pt-0.5">
                  {teamReport.methodology.dataSources.map((ds, idx) => (
                    <li key={idx}>{ds}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-ink font-bold block">Calculation Rules:</span>
                <ul className="list-disc list-inside space-y-0.5 pt-0.5">
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
      {/* 9. INDIVIDUAL MEMBER REPORT DEEP-DIVE MODAL / DRAWER                      */}
      {/* ========================================================================= */}
      {inspectMemberModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-paper border border-line rounded-md max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-6 shadow-xl font-sans relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xs bg-ink text-paper font-mono font-bold text-base flex items-center justify-center">
                  {inspectMemberModal.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-display text-lg font-black text-ink uppercase">
                      {inspectMemberModal.name}
                    </h2>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-paper-dark border border-line rounded-xs">
                      {inspectMemberModal.serialNumber}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">
                    {inspectMemberModal.position} · {inspectMemberModal.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectMemberModal(null)}
                className="p-1.5 rounded-xs hover:bg-paper-dark border border-line text-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Deliverables 4-Card Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center">
              <div className="p-3 bg-paper-light border border-line rounded-xs">
                <span className="text-[10px] text-muted uppercase font-bold block">Tasks Done</span>
                <span className="font-display text-xl font-black text-ink block">{inspectMemberModal.tasksCompleted} / {inspectMemberModal.tasksAssigned}</span>
                <span className="text-[10px] text-accent font-bold block">{inspectMemberModal.taskCompletionPct}% Rate</span>
              </div>
              <div className="p-3 bg-paper-light border border-line rounded-xs">
                <span className="text-[10px] text-muted uppercase font-bold block">HW Submissions</span>
                <span className="font-display text-xl font-black text-ink block">{inspectMemberModal.homeworkSubmitted}</span>
                <span className="text-[10px] text-muted block">{inspectMemberModal.homeworkReviewed} Reviewed</span>
              </div>
              <div className="p-3 bg-paper-light border border-line rounded-xs">
                <span className="text-[10px] text-muted uppercase font-bold block">Standup Consistency</span>
                <span className="font-display text-xl font-black text-ink block">{inspectMemberModal.standupsSubmitted} / {inspectMemberModal.standupsExpected}</span>
                <span className="text-[10px] text-accent font-bold block">{inspectMemberModal.standupConsistencyPct}% Rate</span>
              </div>
              <div className="p-3 bg-paper-light border border-line rounded-xs">
                <span className="text-[10px] text-muted uppercase font-bold block">Current Streak</span>
                <span className="font-display text-xl font-black text-ink block">{inspectMemberModal.currentStreakDays} Days</span>
                <span className="text-[10px] text-muted block">Active Standups</span>
              </div>
            </div>

            {/* Member Insights */}
            <div className="p-4 bg-paper-dark/40 border border-line rounded-xs space-y-2 font-sans">
              <span className="font-mono text-xs font-bold text-ink uppercase block">Factual Activity Insights:</span>
              <ul className="space-y-1 text-xs text-muted font-normal">
                {inspectMemberModal.memberInsights.map((ins, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-accent font-bold">•</span>
                    <span><strong>{ins.title}:</strong> {ins.insightText}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chronological Activity Timeline */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center space-x-2 border-b border-line pb-2">
                <Clock className="w-4 h-4 text-accent" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  CHRONOLOGICAL ACTIVITY TIMELINE ({inspectMemberModal.activityTimeline.length} EVENTS)
                </h3>
              </div>

              {inspectMemberModal.activityTimeline.length === 0 ? (
                <div className="p-6 text-center font-mono text-xs text-muted border border-dashed border-line rounded-xs">
                  No recorded activity transactions in this reporting period.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {inspectMemberModal.activityTimeline.map((ev, idx) => (
                    <div key={idx} className="p-3 bg-paper-light border border-line rounded-xs flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-ink">{ev.title}</span>
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 bg-paper-dark border border-line rounded-xs uppercase">
                            {ev.statusBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted font-normal">{ev.description}</p>
                      </div>
                      <span className="font-mono text-[10px] text-muted shrink-0">{ev.formattedDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-line flex justify-end">
              <button
                onClick={() => setInspectMemberModal(null)}
                className="px-4 py-2 bg-ink text-paper rounded-xs font-mono text-xs font-bold shadow-2xs"
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
