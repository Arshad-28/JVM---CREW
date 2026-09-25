import React from 'react';

export type PageContainerWidth = 'default' | 'wide' | 'narrow' | 'full';

interface PageContainerProps {
  children: React.ReactNode;
  width?: PageContainerWidth;
  className?: string;
  noPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  width = 'default',
  className = '',
  noPadding = false,
}) => {
  const widthClasses = {
    narrow: 'max-w-[960px]',     // 960px focused (Account Settings, Profile Forms)
    default: 'max-w-[1200px]',    // 1200px standard (My Day, Homework, Team Meetings, Profile, Meet the Crew)
    wide: 'max-w-[1440px]',       // 1440px high-density (Kanban Tasks, Team Cockpit, Performance Reports, Interview Lab)
    full: 'w-full max-w-full',
  }[width];

  const paddingClasses = noPadding ? '' : 'px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7 lg:py-8';

  return (
    <div className={`w-full mx-auto ${widthClasses} ${paddingClasses} min-w-0 animate-page-enter ${className}`}>
      {children}
    </div>
  );
};
