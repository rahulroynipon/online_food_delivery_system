'use client';

import * as React from 'react';
import { Clock, X } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import { Dropdown, Menu, Trigger, useDropdown } from '../Dropdown';
import { Button } from '../Button';
import { ToggleGroup } from '../ToggleGroup';
import type { TimePickerProps } from './timePicker.types';

// Helper to parse time string
const parseTimeString = (timeStr: string | Date | undefined, formatType: '12h' | '24h') => {
  let initialHour = 12;
  let initialMinute = 0;
  let initialSecond = 0;
  let initialPeriod: 'AM' | 'PM' = 'AM';
  let hasValidValue = false;

  if (timeStr instanceof Date) {
    let hours = timeStr.getHours();
    initialMinute = timeStr.getMinutes();
    initialSecond = timeStr.getSeconds();
    if (formatType === '12h') {
      initialPeriod = hours >= 12 ? 'PM' : 'AM';
      initialHour = hours % 12;
      if (initialHour === 0) initialHour = 12;
    } else {
      initialHour = hours;
    }
    hasValidValue = true;
    return {
      hour: initialHour,
      minute: initialMinute,
      second: initialSecond,
      period: initialPeriod,
      hasValidValue,
    };
  }

  if (typeof timeStr === 'string' && timeStr.trim() !== '') {
    try {
      if (formatType === '12h') {
        const periodMatch = timeStr.match(/(AM|PM)/i);
        if (periodMatch) {
          initialPeriod = periodMatch[0].toUpperCase() as 'AM' | 'PM';
        }
        const cleanTime = timeStr.replace(/(AM|PM)/i, '').trim();
        const parts = cleanTime.split(':');
        if (parts.length >= 2) {
          initialHour = parseInt(parts[0], 10);
          initialMinute = parseInt(parts[1], 10);
          if (parts.length >= 3) {
            initialSecond = parseInt(parts[2], 10);
          }
          hasValidValue = true;
        }
      } else {
        const parts = timeStr.trim().split(':');
        if (parts.length >= 2) {
          initialHour = parseInt(parts[0], 10);
          initialMinute = parseInt(parts[1], 10);
          if (parts.length >= 3) {
            initialSecond = parseInt(parts[2], 10);
          }
          hasValidValue = true;
        }
      }
    } catch (e) {
      console.error('Failed to parse time string:', e);
    }
  }

  if (isNaN(initialHour)) initialHour = formatType === '12h' ? 12 : 0;
  if (isNaN(initialMinute)) initialMinute = 0;
  if (isNaN(initialSecond)) initialSecond = 0;

  return {
    hour: initialHour,
    minute: initialMinute,
    second: initialSecond,
    period: initialPeriod,
    hasValidValue,
  };
};

const formatTimeValue = (
  h: number,
  m: number,
  s: number,
  p: 'AM' | 'PM',
  formatType: '12h' | '24h',
  showSeconds: boolean
) => {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (formatType === '12h') {
    return showSeconds ? `${hh}:${mm}:${ss} ${p}` : `${hh}:${mm} ${p}`;
  } else {
    return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  }
};

// Main Clock Dialog component rendered inside Dropdown Menu
function TimePickerDialog({
  value,
  onChange,
  formatType,
  showSeconds,
}: {
  value: string | Date | undefined;
  onChange: (val: string) => void;
  formatType: '12h' | '24h';
  showSeconds: boolean;
}) {
  const { close } = useDropdown();
  const parsed = React.useMemo(() => parseTimeString(value, formatType), [value, formatType]);

  const [activeMode, setActiveMode] = React.useState<'hour' | 'minute' | 'second'>('hour');
  const [hour, setHour] = React.useState(parsed.hour);
  const [minute, setMinute] = React.useState(parsed.minute);
  const [second, setSecond] = React.useState(parsed.second);
  const [period, setPeriod] = React.useState(parsed.period);

  const clockRef = React.useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const digitBufferRef = React.useRef<string>('');

  React.useEffect(() => {
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setSecond(parsed.second);
    setPeriod(parsed.period);
  }, [parsed]);

  const handleApply = () => {
    onChange(formatTimeValue(hour, minute, second, period, formatType, showSeconds));
    close();
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent, mode: 'hour' | 'minute' | 'second') => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      digitBufferRef.current = '';
      const delta = e.key === 'ArrowUp' ? 1 : -1;
      if (mode === 'hour') {
        const max = formatType === '24h' ? 23 : 12;
        const min = formatType === '24h' ? 0 : 1;
        let nextHour = hour + delta;
        if (nextHour > max) nextHour = min;
        if (nextHour < min) nextHour = max;
        setHour(nextHour);
      } else if (mode === 'minute') {
        let nextMin = minute + delta;
        if (nextMin > 59) nextMin = 0;
        if (nextMin < 0) nextMin = 59;
        setMinute(nextMin);
      } else if (mode === 'second') {
        let nextSec = second + delta;
        if (nextSec > 59) nextSec = 0;
        if (nextSec < 0) nextSec = 59;
        setSecond(nextSec);
      }
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const num = e.key;
      const buffer = digitBufferRef.current + num;
      const parsedVal = parseInt(buffer, 10);

      if (mode === 'hour') {
        const max = formatType === '24h' ? 23 : 12;
        if (parsedVal <= max) {
          setHour(parsedVal);
          if (buffer.length >= 2 || parsedVal > (formatType === '24h' ? 2 : 1)) {
            digitBufferRef.current = '';
            setActiveMode('minute');
          } else {
            digitBufferRef.current = buffer;
          }
        } else {
          const singleVal = parseInt(num, 10);
          setHour(singleVal);
          digitBufferRef.current = num;
        }
      } else if (mode === 'minute') {
        if (parsedVal <= 59) {
          setMinute(parsedVal);
          if (buffer.length >= 2 || parsedVal > 5) {
            digitBufferRef.current = '';
            if (showSeconds) {
              setActiveMode('second');
            }
          } else {
            digitBufferRef.current = buffer;
          }
        } else {
          const singleVal = parseInt(num, 10);
          setMinute(singleVal);
          digitBufferRef.current = num;
        }
      } else if (mode === 'second') {
        if (parsedVal <= 59) {
          setSecond(parsedVal);
          if (buffer.length >= 2 || parsedVal > 5) {
            digitBufferRef.current = '';
          } else {
            digitBufferRef.current = buffer;
          }
        } else {
          const singleVal = parseInt(num, 10);
          setSecond(singleVal);
          digitBufferRef.current = num;
        }
      }
    } else if (e.key.toLowerCase() === 'a' && formatType === '12h') {
      e.preventDefault();
      setPeriod('AM');
    } else if (e.key.toLowerCase() === 'p' && formatType === '12h') {
      e.preventDefault();
      setPeriod('PM');
    }
  };

  const handleAngleCalculation = (clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let angleRad = Math.atan2(dy, dx) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;

    let angleDeg = (angleRad * 180) / Math.PI;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (activeMode === 'hour') {
      if (formatType === '12h') {
        let val = Math.round(angleDeg / 30);
        if (val === 0) val = 12;
        if (val > 12) val = 12;
        setHour(val);
      } else {
        const pctDist = (dist / (rect.width / 2)) * 100;
        let val = Math.round(angleDeg / 30) % 12;
        if (val === 0) val = 12;

        if (pctDist < 62.5) {
          setHour(val);
        } else {
          const outerVal = val + 12;
          setHour(outerVal === 24 ? 0 : outerVal);
        }
      }
    } else if (activeMode === 'minute') {
      let val = Math.round(angleDeg / 6) % 60;
      setMinute(val);
    } else if (activeMode === 'second') {
      let val = Math.round(angleDeg / 6) % 60;
      setSecond(val);
    }
  };

  const handlePointerDown = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleAngleCalculation(clientX, clientY);
  };

  React.useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      handleAngleCalculation(clientX, clientY);
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (activeMode === 'hour') {
          setActiveMode('minute');
        } else if (activeMode === 'minute' && showSeconds) {
          setActiveMode('second');
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, activeMode, showSeconds]);

  const renderClockNumbers = () => {
    if (activeMode === 'hour') {
      if (formatType === '12h') {
        return Array.from({ length: 12 }, (_, i) => {
          const num = i + 1;
          const angle = (num * 30 * Math.PI) / 180;
          const r = 75;
          const x = 100 + r * Math.sin(angle);
          const y = 100 - r * Math.cos(angle);
          const isSelected = hour === num;
          return (
            <text
              key={num}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              style={{
                fill: isSelected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                fontSize: '10px',
                fontWeight: isSelected ? 600 : 500,
              }}
              className="transition-colors select-none pointer-events-none"
            >
              {num}
            </text>
          );
        });
      } else {
        const innerNumbers = Array.from({ length: 12 }, (_, i) => {
          const num = i + 1;
          const angle = (num * 30 * Math.PI) / 180;
          const r = 50;
          const x = 100 + r * Math.sin(angle);
          const y = 100 - r * Math.cos(angle);
          const isSelected = hour === num;
          return (
            <text
              key={`inner-${num}`}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              style={{
                fill: isSelected
                  ? 'var(--color-primary-foreground)'
                  : 'var(--color-muted-foreground)',
                fontSize: '8.5px',
                fontWeight: isSelected ? 600 : 500,
              }}
              className="transition-colors select-none pointer-events-none"
            >
              {num}
            </text>
          );
        });

        const outerNumbers = Array.from({ length: 12 }, (_, i) => {
          const num = i + 13 === 25 ? 0 : i + 13;
          const angle = ((i + 1) * 30 * Math.PI) / 180;
          const r = 76;
          const x = 100 + r * Math.sin(angle);
          const y = 100 - r * Math.cos(angle);
          const isSelected = hour === num;
          return (
            <text
              key={`outer-${num}`}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              style={{
                fill: isSelected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                fontSize: '9.5px',
                fontWeight: isSelected ? 600 : 500,
              }}
              className="transition-colors select-none pointer-events-none"
            >
              {num === 0 ? '00' : num}
            </text>
          );
        });

        return [...innerNumbers, ...outerNumbers];
      }
    } else {
      const currentVal = activeMode === 'minute' ? minute : second;
      return Array.from({ length: 12 }, (_, i) => {
        const val = i * 5;
        const angle = (val * 6 * Math.PI) / 180;
        const r = 75;
        const x = 100 + r * Math.sin(angle);
        const y = 100 - r * Math.cos(angle);
        const isSelected = currentVal === val;
        return (
          <text
            key={val}
            x={x}
            y={y + 3.5}
            textAnchor="middle"
            style={{
              fill: isSelected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
              fontSize: '10px',
              fontWeight: isSelected ? 600 : 500,
            }}
            className="transition-colors select-none pointer-events-none"
          >
            {String(val).padStart(2, '0')}
          </text>
        );
      });
    }
  };

  const getHandCoordinates = () => {
    let r = 75;
    let angleDeg = 0;

    if (activeMode === 'hour') {
      if (formatType === '12h') {
        angleDeg = hour * 30;
      } else {
        if (hour > 12 || hour === 0) {
          r = 76;
          const displayHour = hour === 0 ? 12 : hour - 12;
          angleDeg = displayHour * 30;
        } else {
          r = 50;
          angleDeg = hour * 30;
        }
      }
    } else {
      const currentVal = activeMode === 'minute' ? minute : second;
      angleDeg = currentVal * 6;
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const x = 100 + r * Math.sin(angleRad);
    const y = 100 - r * Math.cos(angleRad);

    return { x, y, r };
  };

  const hand = getHandCoordinates();

  return (
    <div className="flex flex-col w-[260px] bg-background border border-border rounded-lg overflow-hidden shadow-xl select-none">
      <div className="flex flex-col items-center justify-center py-4 bg-primary text-primary-foreground border-b border-border">
        <div className="flex items-baseline gap-1 font-mono text-3xl font-bold tracking-wider">
          <button
            type="button"
            onClick={() => {
              setActiveMode('hour');
              digitBufferRef.current = '';
            }}
            onKeyDown={(e) => handleHeaderKeyDown(e, 'hour')}
            className={`hover:opacity-100 transition-opacity focus:outline-none focus:underline ${activeMode === 'hour' ? 'text-primary-foreground opacity-100 underline decoration-2 underline-offset-4' : 'opacity-60'}`}
          >
            {String(hour).padStart(2, '0')}
          </button>
          <span className="opacity-60 text-2xl font-light">:</span>
          <button
            type="button"
            onClick={() => {
              setActiveMode('minute');
              digitBufferRef.current = '';
            }}
            onKeyDown={(e) => handleHeaderKeyDown(e, 'minute')}
            className={`hover:opacity-100 transition-opacity focus:outline-none focus:underline ${activeMode === 'minute' ? 'text-primary-foreground opacity-100 underline decoration-2 underline-offset-4' : 'opacity-60'}`}
          >
            {String(minute).padStart(2, '0')}
          </button>
          {showSeconds && (
            <>
              <span className="opacity-60 text-2xl font-light">:</span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('second');
                  digitBufferRef.current = '';
                }}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'second')}
                className={`hover:opacity-100 transition-opacity focus:outline-none focus:underline ${activeMode === 'second' ? 'text-primary-foreground opacity-100 underline decoration-2 underline-offset-4' : 'opacity-60'}`}
              >
                {String(second).padStart(2, '0')}
              </button>
            </>
          )}
        </div>

        {formatType === '12h' && (
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(val) => {
              if (val) setPeriod(val as 'AM' | 'PM');
            }}
            allowEmpty={false}
            size="xs"
            variant="ghost"
            className="mt-3 bg-primary-foreground/10 p-0.5 rounded-[var(--radius-md)] gap-0.5 border-none"
            activeClassName="!bg-primary-foreground !text-primary shadow-sm font-bold scale-105 !border-transparent"
            inactiveClassName="!bg-transparent !border-transparent text-primary-foreground hover:text-primary-foreground"
          >
            <ToggleGroup.Item
              value="AM"
              className="px-3 py-1 rounded-[var(--radius-sm)] !border-transparent"
            >
              AM
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="PM"
              className="px-3 py-1 rounded-[var(--radius-sm)] !border-transparent"
            >
              PM
            </ToggleGroup.Item>
          </ToggleGroup>
        )}
      </div>

      <div className="flex items-center justify-center p-5 bg-muted/20">
        <svg
          ref={clockRef}
          width="180"
          height="180"
          viewBox="0 0 200 200"
          className="relative cursor-pointer select-none touch-none filter drop-shadow-sm"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            style={{
              fill: 'var(--color-accent)',
              stroke: 'var(--color-border)',
              strokeWidth: 1,
            }}
          />
          <circle cx="100" cy="100" r="3.5" style={{ fill: 'var(--color-primary)' }} />
          <line
            x1="100"
            y1="100"
            x2={hand.x}
            y2={hand.y}
            style={{
              stroke: 'var(--color-primary)',
              strokeWidth: 2,
              transition: isDragging ? 'none' : 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          <circle
            cx={hand.x}
            cy={hand.y}
            r="12"
            style={{
              fill: 'var(--color-primary)',
              transition: isDragging ? 'none' : 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          {renderClockNumbers()}
        </svg>
      </div>

      <div className="flex justify-end gap-2 px-3 py-2 bg-muted/30 border-t border-border">
        <Button size="sm" variant="ghost" onClick={() => close()}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={handleApply}>
          OK
        </Button>
      </div>
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  format = '12h',
  showSeconds = false,
  label,
  description,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  rounded = 'md',
  mode = 'both',
  className,
  style,
}: TimePickerProps) {
  const parsed = React.useMemo(() => parseTimeString(value, format), [value, format]);

  // Keep state coordinates for Segmented values
  const [hour, setHour] = React.useState(parsed.hour);
  const [minute, setMinute] = React.useState(parsed.minute);
  const [second, setSecond] = React.useState(parsed.second);
  const [period, setPeriod] = React.useState(parsed.period);

  React.useEffect(() => {
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setSecond(parsed.second);
    setPeriod(parsed.period);
  }, [parsed]);

  // Ref container coordinates for cursor keys shifting
  const hourRef = React.useRef<HTMLSpanElement>(null);
  const minuteRef = React.useRef<HTMLSpanElement>(null);
  const secondRef = React.useRef<HTMLSpanElement>(null);
  const periodRef = React.useRef<HTMLSpanElement>(null);

  const [activeSegment, setActiveSegment] = React.useState<
    'hour' | 'minute' | 'second' | 'period' | null
  >(null);
  const digitBufferRef = React.useRef<string>('');

  const triggerChange = (h: number, m: number, s: number, p: 'AM' | 'PM') => {
    if (onChange) {
      onChange(formatTimeValue(h, m, s, p, format, showSeconds));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    segment: 'hour' | 'minute' | 'second' | 'period'
  ) => {
    if (disabled || mode === 'pick') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      digitBufferRef.current = '';
      if (segment === 'minute') hourRef.current?.focus();
      else if (segment === 'second') minuteRef.current?.focus();
      else if (segment === 'period') {
        if (showSeconds) secondRef.current?.focus();
        else minuteRef.current?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      digitBufferRef.current = '';
      if (segment === 'hour') minuteRef.current?.focus();
      else if (segment === 'minute') {
        if (showSeconds) secondRef.current?.focus();
        else if (format === '12h') periodRef.current?.focus();
      } else if (segment === 'second') {
        if (format === '12h') periodRef.current?.focus();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      digitBufferRef.current = '';
      const delta = e.key === 'ArrowUp' ? 1 : -1;

      if (segment === 'hour') {
        const max = format === '24h' ? 23 : 12;
        const min = format === '24h' ? 0 : 1;
        let nextHour = hour + delta;
        if (nextHour > max) nextHour = min;
        if (nextHour < min) nextHour = max;
        setHour(nextHour);
        triggerChange(nextHour, minute, second, period);
      } else if (segment === 'minute') {
        let nextMin = minute + delta;
        if (nextMin > 59) nextMin = 0;
        if (nextMin < 0) nextMin = 59;
        setMinute(nextMin);
        triggerChange(hour, nextMin, second, period);
      } else if (segment === 'second') {
        let nextSec = second + delta;
        if (nextSec > 59) nextSec = 0;
        if (nextSec < 0) nextSec = 59;
        setSecond(nextSec);
        triggerChange(hour, minute, nextSec, period);
      } else if (segment === 'period' && format === '12h') {
        const nextPeriod = period === 'AM' ? 'PM' : 'AM';
        setPeriod(nextPeriod);
        triggerChange(hour, minute, second, nextPeriod);
      }
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      if (segment === 'period') return;

      const num = e.key;
      const buffer = digitBufferRef.current + num;
      const parsedVal = parseInt(buffer, 10);

      if (segment === 'hour') {
        const max = format === '24h' ? 23 : 12;
        if (parsedVal <= max) {
          setHour(parsedVal);
          triggerChange(parsedVal, minute, second, period);
          if (buffer.length >= 2 || parsedVal > (format === '24h' ? 2 : 1)) {
            digitBufferRef.current = '';
            minuteRef.current?.focus();
          } else {
            digitBufferRef.current = buffer;
          }
        } else {
          // If typed value is above max, treat the new key as first digit
          const singleVal = parseInt(num, 10);
          setHour(singleVal);
          triggerChange(singleVal, minute, second, period);
          digitBufferRef.current = num;
        }
      } else if (segment === 'minute') {
        if (parsedVal <= 59) {
          setMinute(parsedVal);
          triggerChange(hour, parsedVal, second, period);
          if (buffer.length >= 2 || parsedVal > 5) {
            digitBufferRef.current = '';
            if (showSeconds) secondRef.current?.focus();
            else if (format === '12h') periodRef.current?.focus();
          } else {
            digitBufferRef.current = buffer;
          }
        } else {
          const singleVal = parseInt(num, 10);
          setMinute(singleVal);
          triggerChange(hour, singleVal, second, period);
          digitBufferRef.current = num;
        }
      } else if (segment === 'second') {
        if (parsedVal <= 59) {
          setSecond(parsedVal);
          triggerChange(hour, minute, parsedVal, period);
          if (buffer.length >= 2 || parsedVal > 5) {
            digitBufferRef.current = '';
            if (format === '12h') periodRef.current?.focus();
          } else {
            digitBufferRef.current = buffer;
          }
        } else {
          const singleVal = parseInt(num, 10);
          setSecond(singleVal);
          triggerChange(hour, minute, singleVal, period);
          digitBufferRef.current = num;
        }
      }
    } else if (e.key.toLowerCase() === 'a' && segment === 'period' && format === '12h') {
      e.preventDefault();
      setPeriod('AM');
      triggerChange(hour, minute, second, 'AM');
    } else if (e.key.toLowerCase() === 'p' && segment === 'period' && format === '12h') {
      e.preventDefault();
      setPeriod('PM');
      triggerChange(hour, minute, second, 'PM');
    }
  };

  const hasValue = parsed.hasValidValue;

  const roundedClasses = {
    none: 'rounded-[var(--radius-none)]',
    sm: 'rounded-[var(--radius-sm)]',
    md: 'rounded-[var(--radius-md)]',
    lg: 'rounded-[var(--radius-lg)]',
    full: 'rounded-[var(--radius-full)]',
  };

  const sizeClasses = {
    xs: 'h-7 text-xs px-2 gap-1',
    sm: 'h-8 text-xs px-2.5 gap-1',
    md: 'h-[38px] text-sm px-3 gap-1.5',
    lg: 'h-11 text-base px-4 gap-2',
  };

  const triggerButtonSize = {
    xs: 'icon-xxs' as const,
    sm: 'icon-xxs' as const,
    md: 'icon-xs' as const,
    lg: 'icon-sm' as const,
  };
  const inputContainerEl = (
    <div
      tabIndex={mode === 'pick' && !disabled ? 0 : undefined}
      onClick={(e) => {
        if (mode === 'both') {
          const isClockClick = (e.target as HTMLElement).closest('.clock-trigger');
          if (!isClockClick) {
            e.stopPropagation();
          }
        }
      }}
      onKeyDown={(e) => {
        if (mode === 'pick' && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
      className={cn(
        'relative flex items-center w-full border transition-all overflow-hidden bg-[var(--color-field-bg)] text-[var(--color-foreground)]',
        sizeClasses[size],
        roundedClasses[rounded],
        disabled && 'opacity-50 cursor-not-allowed',
        error
          ? 'border-[var(--color-danger)]'
          : activeSegment
            ? 'border-[var(--color-ring)] ring-1 ring-[var(--color-ring)]'
            : 'border-[var(--color-input)] hover:border-[var(--color-border)]',
        mode === 'pick' && !disabled && 'cursor-pointer hover:border-[var(--color-border)]'
      )}
    >
      {/* Clock Icon Prefix */}
      {mode === 'both' ? (
        <div className="clock-trigger pointer-events-auto cursor-pointer p-0.5 hover:bg-muted rounded transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] shrink-0 flex items-center justify-center">
          <Clock className="h-4 w-4" />
        </div>
      ) : mode !== 'write' ? (
        <div className="pl-1 pr-1 flex items-center justify-center text-muted-foreground/80 shrink-0 select-none">
          <Clock className="h-4 w-4" />
        </div>
      ) : (
        <div className="pl-2 pr-1 flex items-center justify-center text-muted-foreground/80 shrink-0 select-none">
          <Clock className="h-4 w-4" />
        </div>
      )}

      {/* Segmented Keyboard-controlled input field representation */}
      <div
        className={cn(
          'flex items-center flex-1 font-mono select-none overflow-hidden h-full pr-8',
          mode === 'pick' && 'pointer-events-none'
        )}
      >
        {/* Hour Block */}
        <span
          ref={hourRef}
          tabIndex={disabled || mode === 'pick' ? -1 : 0}
          onFocus={() => {
            setActiveSegment('hour');
            digitBufferRef.current = '';
          }}
          onBlur={() => setActiveSegment(null)}
          onKeyDown={(e) => handleKeyDown(e, 'hour')}
          className={`px-1 rounded outline-none transition-colors ${
            activeSegment === 'hour'
              ? 'bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-foreground font-semibold'
              : 'hover:bg-muted'
          } ${disabled ? 'pointer-events-none opacity-50' : mode === 'pick' ? 'pointer-events-none' : 'cursor-text'}`}
        >
          {hasValue ? String(hour).padStart(2, '0') : 'hh'}
        </span>

        <span className="text-muted-foreground/60 px-0.5 select-none">:</span>

        {/* Minute Block */}
        <span
          ref={minuteRef}
          tabIndex={disabled || mode === 'pick' ? -1 : 0}
          onFocus={() => {
            setActiveSegment('minute');
            digitBufferRef.current = '';
          }}
          onBlur={() => setActiveSegment(null)}
          onKeyDown={(e) => handleKeyDown(e, 'minute')}
          className={`px-1 rounded outline-none transition-colors ${
            activeSegment === 'minute'
              ? 'bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-foreground font-semibold'
              : 'hover:bg-muted'
          } ${disabled ? 'pointer-events-none opacity-50' : mode === 'pick' ? 'pointer-events-none' : 'cursor-text'}`}
        >
          {hasValue ? String(minute).padStart(2, '0') : 'mm'}
        </span>

        {showSeconds && (
          <>
            <span className="text-muted-foreground/60 px-0.5 select-none">:</span>
            {/* Seconds Block */}
            <span
              ref={secondRef}
              tabIndex={disabled || mode === 'pick' ? -1 : 0}
              onFocus={() => {
                setActiveSegment('second');
                digitBufferRef.current = '';
              }}
              onBlur={() => setActiveSegment(null)}
              onKeyDown={(e) => handleKeyDown(e, 'second')}
              className={`px-1 rounded outline-none transition-colors ${
                activeSegment === 'second'
                  ? 'bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-foreground font-semibold'
                  : 'hover:bg-muted'
              } ${disabled ? 'pointer-events-none opacity-50' : mode === 'pick' ? 'pointer-events-none' : 'cursor-text'}`}
            >
              {hasValue ? String(second).padStart(2, '0') : 'ss'}
            </span>
          </>
        )}

        {format === '12h' && (
          <>
            <span className="w-1.5" />
            {/* AM/PM Block */}
            <span
              ref={periodRef}
              tabIndex={disabled || mode === 'pick' ? -1 : 0}
              onFocus={() => {
                setActiveSegment('period');
                digitBufferRef.current = '';
              }}
              onBlur={() => setActiveSegment(null)}
              onKeyDown={(e) => handleKeyDown(e, 'period')}
              className={`px-1.5 rounded outline-none transition-colors text-[11px] uppercase ${
                activeSegment === 'period'
                  ? 'bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-foreground font-semibold'
                  : 'hover:bg-muted'
              } ${disabled ? 'pointer-events-none opacity-50' : mode === 'pick' ? 'pointer-events-none' : 'cursor-text'}`}
            >
              {hasValue ? period : 'AM'}
            </span>
          </>
        )}
      </div>

      {/* Clean Selection cross button */}
      <div
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-150 flex items-center justify-center',
          !hasValue || disabled ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <Button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleClear(e);
          }}
          rounded="full"
          size={triggerButtonSize[size]}
          variant="ghost"
          className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  if (mode === 'write') {
    return (
      <div className={cn('flex flex-col gap-1.5 w-full', className)} style={style}>
        {label && (
          <label className="text-sm font-medium flex items-center gap-0.5 select-none text-[var(--color-foreground)]">
            {label}
            {required && <span className="font-bold text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}
        {inputContainerEl}
        {error && (
          <p className="text-xs text-[var(--color-danger)] font-medium leading-none select-none">
            {error}
          </p>
        )}
        {!error && description && (
          <p className="text-xs text-muted-foreground select-none">{description}</p>
        )}
        {!error && !description && hint && (
          <p className="text-[10px] text-muted-foreground/80 select-none">{hint}</p>
        )}
      </div>
    );
  }

  return (
    <Dropdown className={cn('w-full max-w-sm', className)} style={style}>
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium flex items-center gap-0.5 select-none text-[var(--color-foreground)]">
            {label}
            {required && <span className="font-bold text-[var(--color-danger)] ml-0.5">*</span>}
          </label>
        )}

        {mode === 'pick' || mode === 'both' ? (
          <Trigger>
            <div
              className={cn(
                disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer',
                'w-full'
              )}
            >
              {inputContainerEl}
            </div>
          </Trigger>
        ) : (
          inputContainerEl
        )}

        {error && (
          <p className="text-xs text-[var(--color-danger)] font-medium leading-none select-none">
            {error}
          </p>
        )}
        {!error && description && (
          <p className="text-xs text-muted-foreground select-none">{description}</p>
        )}
        {!error && !description && hint && (
          <p className="text-[10px] text-muted-foreground/80 select-none">{hint}</p>
        )}
      </div>

      <Menu align="start" side="auto" className="p-0 border-0 bg-transparent shadow-none">
        <TimePickerDialog
          value={value}
          onChange={onChange || (() => {})}
          formatType={format}
          showSeconds={showSeconds}
        />
      </Menu>
    </Dropdown>
  );
}

export default TimePicker;
