import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (CustomSelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'indigo' | 'slate' | 'compact-dark' | 'compact-light';
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  title?: string;
  align?: 'left' | 'right';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  theme = 'light',
  size = 'md',
  id,
  title,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Normalize options array to structured objects
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Position calculation (flip upward if close to bottom of screen)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const neededSpace = Math.min(normalizedOptions.length * 40 + 20, 260);
      setOpenUpward(spaceBelow < neededSpace && rect.top > neededSpace);
    }
  }, [isOpen, normalizedOptions.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const curIdx = normalizedOptions.findIndex((opt) => opt.value === value);
        setHighlightedIndex(curIdx >= 0 ? curIdx : 0);
        return;
      }

      setHighlightedIndex((prev) => {
        if (e.key === 'ArrowDown') {
          return prev < normalizedOptions.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : normalizedOptions.length - 1;
        }
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        onChange(normalizedOptions[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  // Styling maps based on theme
  const getTriggerClasses = () => {
    const base = 'w-full flex items-center justify-between font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none text-left focus:outline-none';
    
    // Size variants
    let sizeClasses = 'px-3.5 py-2.5 text-xs';
    if (size === 'sm') sizeClasses = 'px-2.5 py-1.5 text-xs';
    if (size === 'lg') sizeClasses = 'px-4 py-3 text-sm';

    // Theme variants
    switch (theme) {
      case 'light':
        return `${base} ${sizeClasses} bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs ${
          isOpen ? 'bg-white border-rose-500 ring-2 ring-rose-500/20' : ''
        }`;
      case 'dark':
        return `${base} ${sizeClasses} bg-slate-950 hover:bg-slate-900 text-slate-100 border border-slate-800 hover:border-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-sm ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/30' : ''
        }`;
      case 'indigo':
        return `${base} ${sizeClasses} bg-slate-800/95 hover:bg-slate-800 text-slate-100 border border-indigo-700/60 hover:border-indigo-600 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 shadow-sm ${
          isOpen ? 'border-rose-400 ring-2 ring-rose-500/30 bg-slate-800' : ''
        }`;
      case 'slate':
        return `${base} ${sizeClasses} bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 shadow-sm ${
          isOpen ? 'border-amber-400 ring-2 ring-amber-400/30' : ''
        }`;
      case 'compact-dark':
        return `${base} px-2 py-1 text-[11px] bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg ${
          isOpen ? 'border-emerald-500' : ''
        }`;
      case 'compact-light':
        return `${base} px-2 py-1 text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg ${
          isOpen ? 'border-rose-500 ring-1 ring-rose-500/20' : ''
        }`;
      default:
        return `${base} ${sizeClasses} bg-white text-slate-800 border border-slate-200`;
    }
  };

  const getMenuClasses = () => {
    const base = `absolute z-50 w-full min-w-[200px] max-w-[340px] sm:max-w-none rounded-2xl shadow-2xl overflow-hidden border backdrop-blur-md transition-all animate-fade-in ${
      align === 'right' ? 'right-0' : 'left-0'
    } ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`;

    switch (theme) {
      case 'light':
      case 'compact-light':
        return `${base} bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-900/15 divide-y divide-slate-100`;
      case 'indigo':
        return `${base} bg-slate-900/98 border-indigo-800/80 text-slate-100 shadow-black/60 divide-y divide-indigo-900/40`;
      case 'dark':
      case 'slate':
      case 'compact-dark':
      default:
        return `${base} bg-slate-950/98 border-slate-800 text-slate-100 shadow-black/70 divide-y divide-slate-850`;
    }
  };

  const getItemClasses = (opt: CustomSelectOption, isSelected: boolean, isHighlighted: boolean) => {
    const isDark = theme === 'dark' || theme === 'indigo' || theme === 'slate' || theme === 'compact-dark';
    
    let base = 'w-full px-3.5 py-2 text-xs flex items-center justify-between gap-2.5 transition-colors cursor-pointer text-left select-none';
    if (size === 'sm' || theme.startsWith('compact')) {
      base = 'w-full px-2.5 py-1.5 text-[11px] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left select-none';
    }

    if (isDark) {
      if (isSelected) {
        return `${base} bg-indigo-600/30 text-white font-bold border-l-2 border-indigo-400`;
      }
      if (isHighlighted) {
        return `${base} bg-slate-800/80 text-slate-100 font-medium`;
      }
      return `${base} text-slate-300 hover:bg-slate-900 hover:text-white`;
    } else {
      if (isSelected) {
        return `${base} bg-rose-50 text-rose-700 font-bold border-l-2 border-rose-600`;
      }
      if (isHighlighted) {
        return `${base} bg-slate-100/80 text-slate-900 font-medium`;
      }
      return `${base} text-slate-700 hover:bg-slate-50 hover:text-slate-900`;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      id={selectId}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={getTriggerClasses()}
        title={title || selectedOption?.label || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-current flex items-center">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 opacity-60 ${
            isOpen ? 'rotate-180 opacity-100' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          className={getMenuClasses()}
        >
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
            {normalizedOptions.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = highlightedIndex === index;

              return (
                <div
                  key={`${opt.value}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={getItemClasses(opt, isSelected, isHighlighted)}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.icon && (
                      <span className="shrink-0 flex items-center text-current">
                        {opt.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[10px] opacity-60 truncate font-normal">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 opacity-80">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-current shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
