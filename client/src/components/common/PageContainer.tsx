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
    default: 'max-w-7xl',        // 1280px standard (My Day, Homework, Curriculum, Profile)
    wide: 'max-w-[1440px]',     // 1440px high-density (Kanban, Team Cockpit, Coding Arena)
    narrow: 'max-w-4xl',         // 896px focused (Account Settings, Submission Forms)
    full: 'w-full max-w-full',
  }[width];

  const paddingClasses = noPadding ? '' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8';

  return (
    <div className={`w-full mx-auto ${widthClasses} ${paddingClasses} min-w-0 ${className}`}>
      {children}
    </div>
  );
};
