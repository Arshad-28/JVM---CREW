import React from 'react';
import { TaskPriority, TaskStatus, LearningStatus, ProblemDifficulty } from '../../types';

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'learning' | 'difficulty' | 'general';
  value: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm', className = '' }) => {
  let style = 'bg-paper-dark text-muted border-line';
  const valUpper = (value || '').toUpperCase();

  if (type === 'priority') {
    const p = valUpper as TaskPriority;
    if (p === 'HIGH') style = 'bg-danger-soft text-danger border-danger/30 font-bold';
    else if (p === 'MED') style = 'bg-warning-soft text-warning border-warning/30 font-semibold';
    else style = 'bg-paper-dark text-muted border-line font-medium';
  } else if (type === 'status') {
    const s = valUpper as TaskStatus | 'BLOCKED';
    if (s === 'DONE') style = 'bg-success-soft text-success border-success/30 font-bold';
    else if (s === 'IN_PROGRESS') style = 'bg-primary-soft text-primary border-primary/30 font-bold';
    else if (s === 'REVIEW') style = 'bg-warning-soft text-warning border-warning/30 font-bold';
    else if (s === 'BLOCKED') style = 'bg-danger-soft text-danger border-danger/30 font-bold';
    else if (s === 'TODO') style = 'bg-paper-dark text-ink border-line font-semibold';
    else style = 'bg-paper text-muted border-line';
  } else if (type === 'learning') {
    const l = valUpper as LearningStatus;
    if (l === 'DONE') style = 'bg-success-soft text-success border-success/30 font-bold';
    else if (l === 'IN_PROGRESS') style = 'bg-primary-soft text-primary border-primary/30 font-bold';
    else style = 'bg-paper text-muted border-line';
  } else if (type === 'difficulty') {
    const d = valUpper as ProblemDifficulty;
    if (d === 'HARD') style = 'bg-danger-soft text-danger border-danger/30 font-bold';
    else if (d === 'MEDIUM') style = 'bg-warning-soft text-warning border-warning/30 font-semibold';
    else style = 'bg-success-soft text-success border-success/30 font-semibold';
  } else {
    if (valUpper === 'SUBMITTED' || valUpper === 'REVIEWED' || valUpper === 'ON_TRACK' || valUpper === 'ACTIVE' || valUpper === 'OPTIMAL') {
      style = 'bg-success-soft text-success border-success/30 font-bold';
    } else if (valUpper === 'PENDING' || valUpper === 'NEEDS_ATTENTION' || valUpper === 'GOOD') {
      style = 'bg-warning-soft text-warning border-warning/30 font-bold';
    } else if (valUpper === 'OVERDUE' || valUpper === 'AT_RISK' || valUpper === 'REQUIRES_ATTENTION') {
      style = 'bg-danger-soft text-danger border-danger/30 font-bold';
    }
  }

  const sizeStyles = size === 'md'
    ? 'text-[11px] px-2 py-0.5'
    : 'text-[9px] sm:text-[10px] px-1.5 py-0.2';

  return (
    <span
      className={`font-mono uppercase rounded-xs border inline-flex items-center tracking-wider shrink-0 ${sizeStyles} ${style} ${className}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
};
