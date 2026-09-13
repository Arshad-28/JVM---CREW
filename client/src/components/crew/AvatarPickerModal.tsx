import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Search,
  Sparkles,
  User,
  Car,
  Gauge,
  Bot,
  Gamepad2,
  Sword,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { AVATAR_LIBRARY, AvatarCategory, AvatarOption } from '../../utils/avatarLibrary';

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatarUrl?: string;
  onSelectAvatar: (url: string) => void;
  onClose: () => void;
}

type CategoryType = 'ALL' | AvatarCategory;

const CATEGORY_TABS: {
  key: CategoryType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'ALL', label: 'All', icon: Sparkles },
  { key: 'ANIME BOYS', label: 'Anime Boys', icon: User },
  { key: 'ANIME GIRLS', label: 'Anime Girls', icon: User },
  { key: 'CARS', label: 'Cars', icon: Car },
  { key: 'BIKES', label: 'Bikes', icon: Gauge },
  { key: 'ROBOTS', label: 'Robots & Mecha', icon: Bot },
  { key: 'GAMING', label: 'Gaming', icon: Gamepad2 },
  { key: 'FANTASY', label: 'Fantasy & Samurai', icon: Sword },
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  currentAvatarUrl,
  onSelectAvatar,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatarUrl || '');

  // Sync selectedUrl whenever modal opens or currentAvatarUrl changes
  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentAvatarUrl || '');
    }
  }, [isOpen, currentAvatarUrl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Category counts calculated from actual avatar collection
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      ALL: AVATAR_LIBRARY.length,
      'ANIME BOYS': 0,
      'ANIME GIRLS': 0,
      'CARS': 0,
      'BIKES': 0,
      'ROBOTS': 0,
      'GAMING': 0,
      'FANTASY': 0,
    };
    AVATAR_LIBRARY.forEach((a) => {
      if (counts[a.category] !== undefined) {
        counts[a.category]++;
      }
    });
    return counts;
  }, []);

  // Filtered avatars (pure visual avatars, searching by label or category)
  const filteredAvatars = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    return AVATAR_LIBRARY.filter((av) => {
      const matchesCategory =
        selectedCategory === 'ALL' || av.category === selectedCategory;
      const matchesSearch =
        !cleanQuery ||
        av.label.toLowerCase().includes(cleanQuery) ||
        av.category.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Selected avatar object
  const activeAvatarObj = useMemo(() => {
    return AVATAR_LIBRARY.find((a) => a.url === selectedUrl);
  }, [selectedUrl]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedUrl) {
      onSelectAvatar(selectedUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 backdrop-blur-sm p-3 sm:p-6 animate-fade-in font-sans">
      {/* Background click backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative z-10 w-full max-w-5xl bg-paper border border-line rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up text-ink">
        {/* ========================================================= */}
        {/* HEADER                                                    */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-b border-line bg-paper-dark/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-sm bg-ink text-paper flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold tracking-wider text-accent uppercase">
                  AVATAR COLLECTION
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 bg-paper border border-line rounded-xs text-muted">
                  {AVATAR_LIBRARY.length} AVATARS
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink tracking-tight">
                Select Profile Avatar
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xs border border-line hover:border-ink bg-paper flex items-center justify-center text-muted hover:text-ink transition-colors shadow-2xs"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CATEGORY TABS & SEARCH BAR                                */}
        {/* ========================================================= */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-line bg-paper flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Responsive Wrapped Segmented Category Control */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-paper-dark border border-line rounded-xs text-xs font-mono flex-1">
              {CATEGORY_TABS.map((tab) => {
                const IconComp = tab.icon;
                const isSelected = selectedCategory === tab.key;
                const count = categoryCounts[tab.key] ?? 0;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCategory(tab.key)}
                    className={`px-3 py-1.5 rounded-xs transition-all flex items-center space-x-1.5 font-bold ${
                      isSelected
                        ? 'bg-ink text-paper shadow-2xs'
                        : 'text-muted hover:text-ink hover:bg-paper'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-xs ${
                        isSelected
                          ? 'bg-paper/20 text-paper'
                          : 'bg-paper border border-line text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search avatars..."
                className="w-full pl-9 pr-8 py-1.5 bg-paper-dark border border-line focus:border-ink rounded-xs text-xs font-mono text-ink placeholder:text-muted outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* AVATAR GALLERY GRID                                       */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-paper-dark/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredAvatars.map((av: AvatarOption) => {
              const isSelected = selectedUrl === av.url;
              return (
                <div
                  key={av.id}
                  onClick={() => setSelectedUrl(av.url)}
                  className={`group relative p-4 rounded-xs border cursor-pointer transition-all flex flex-col items-center text-center select-none ${
                    isSelected
                      ? 'bg-paper border-accent ring-2 ring-accent/30 shadow-md transform -translate-y-0.5'
                      : 'bg-paper border-line hover:border-ink/60 hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  {/* Selected Active Check Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent text-paper rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Large Circular Avatar Container */}
                  <div
                    className={`relative w-24 h-24 rounded-full border-2 overflow-hidden shrink-0 shadow-inner mb-3 transition-transform duration-200 group-hover:scale-105 ${
                      isSelected
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-line bg-paper-dark'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Pure Avatar Label */}
                  <div className="w-full">
                    <span
                      className={`font-semibold text-xs tracking-tight truncate block ${
                        isSelected ? 'text-accent' : 'text-ink'
                      }`}
                    >
                      {av.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAvatars.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-paper border border-line flex items-center justify-center text-muted">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-mono text-xs text-muted">
                No avatars matching &quot;{searchQuery}&quot; in{' '}
                {selectedCategory} category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="font-mono text-xs text-accent font-bold hover:underline inline-block mt-1"
              >
                Clear Search & View All
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOOTER ACTION BAR                                         */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-t border-line bg-paper flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Active Selection Summary */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {selectedUrl ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full border border-accent ring-1 ring-accent/30 overflow-hidden shrink-0 shadow-xs bg-paper-dark">
                  <img
                    src={selectedUrl}
                    alt="Selected Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-ink">
                      {activeAvatarObj ? activeAvatarObj.label : 'Selected Avatar'}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="font-mono text-[10px] text-muted block truncate max-w-[260px]">
                    {activeAvatarObj ? activeAvatarObj.category : 'Ready to apply'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-muted font-mono text-xs">
                <Layers className="w-4 h-4" />
                <span>Select an avatar from the gallery above</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-paper-dark hover:bg-paper-dark/80 border border-line rounded-xs font-mono text-xs font-bold text-muted hover:text-ink transition-colors shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleApply}
              className="px-5 py-2 bg-ink hover:bg-ink-light text-paper rounded-xs font-mono text-xs font-bold transition-all disabled:opacity-40 flex items-center space-x-2 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-paper" />
              <span>Apply to Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

