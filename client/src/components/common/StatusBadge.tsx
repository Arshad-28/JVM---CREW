import React from 'react';
import { TaskPriority, TaskStatus, LearningStatus, ProblemDifficulty } from '../../types';

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'learning' | 'difficulty';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let style = 'bg-paper-dark text-muted border-line';

  if (type === 'priority') {
    const p = value as TaskPriority;
    if (p === 'HIGH') style = 'bg-attention-subtle text-attention border-attention/30 font-medium';
    else if (p === 'MED') style = 'bg-paper-dark text-ink-light border-line';
    else style = 'bg-paper text-muted border-line';
  } else if (type === 'status') {
    const s = value as TaskStatus;
    if (s === 'DONE') style = 'bg-accent-subtle text-accent border-accent/30 font-medium';
    else if (s === 'IN_PROGRESS') style = 'bg-paper-dark text-ink border-line-dark font-medium';
    else if (s === 'REVIEW') style = 'bg-paper-light text-ink border-line';
    else style = 'bg-paper text-muted border-line';
  } else if (type === 'learning') {
    const l = value as LearningStatus;
    if (l === 'DONE') style = 'bg-accent-subtle text-accent border-accent/30 font-medium';
    else if (l === 'IN_PROGRESS') style = 'bg-paper-dark text-ink border-line-dark font-medium';
    else style = 'bg-paper text-muted border-line';
  } else if (type === 'difficulty') {
    const d = value as ProblemDifficulty;
    if (d === 'HARD') style = 'bg-attention-subtle text-attention border-attention/30 font-medium';
    else if (d === 'MEDIUM') style = 'bg-paper-dark text-ink-light border-line';
    else style = 'bg-accent-subtle text-accent border-accent/30';
  }

  return (
    <span
      className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm border inline-flex items-center tracking-tight ${style}`}
    >
      {value.replace('_', ' ')}
    </span>
  );
};
