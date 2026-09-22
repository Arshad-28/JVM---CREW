import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center space-x-4 sm:space-x-6 border-b border-line overflow-x-auto no-scrollbar ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center space-x-2 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors duration-160 select-none ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted hover:text-ink hover:border-line-dark'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-xs ${
                    isActive ? 'bg-primary-soft text-primary font-bold' : 'bg-paper-dark text-muted'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 bg-paper-dark p-1 rounded-sm border border-line overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-all duration-160 select-none ${
              isActive
                ? 'bg-paper-light text-primary border border-primary/20 shadow-2xs font-bold'
                : 'text-muted hover:text-ink hover:bg-paper-light/60'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`font-mono text-[9px] px-1.5 py-0.2 rounded-xs font-bold ${
                  isActive ? 'bg-primary text-white' : 'bg-paper text-muted'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
