import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = '',
  minWidth = '640px',
}) => {
  return (
    <div className={`w-full overflow-x-auto border border-line rounded-sm bg-paper shadow-2xs no-scrollbar ${className}`}>
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
};
