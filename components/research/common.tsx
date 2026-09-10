'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, ArrowUpRight, Download } from 'lucide-react';
export function Badge({ state = 'EXECUTED' }: { state?: string }) {
  return (
    <span
      className={'evidence-badge ' + state.toLowerCase().replaceAll(' ', '-')}
    >
      {state === 'EXECUTED' && <span />}
      {state}
    </span>
  );
}
export function Pick({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: (string | [string, string])[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="pick">
      <label>{label}</label>
      <Select
        value={value}
        onValueChange={(v) => v !== null && onChange(String(v))}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue>
            {items
              .map((x) => (typeof x === 'string' ? [x, x] : x))
              .find((x) => x[0] === value)?.[1] ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((i) => {
            const [v, l] = typeof i === 'string' ? [i, i] : i;
            return (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
export function TabBar({
  value,
  items,
  onChange,
}: {
  value: string;
  items: string[];
  onChange: (v: string) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = list.current;
    if (!container) return;
    const reveal = () => {
      const active = container.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!active) return;
      const bounds = container.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.right > bounds.right - 6) container.scrollLeft += tab.right - bounds.right + 6;
      else if (tab.left < bounds.left + 6) container.scrollLeft -= bounds.left - tab.left + 6;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value]);
  return (
    <Tabs value={value} onValueChange={(v) => onChange(String(v))}>
      <TabsList ref={list} variant="default" className="workspace-tabs">
        {items.map((i) => (
          <TabsTrigger key={i} value={i}>
            {i}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
export function Panel({
  title,
  kicker,
  action,
  children,
  dark = false,
  className = '',
}: {
  title: string;
  kicker?: string;
  action?: ReactNode;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section
      className={'panel ' + (dark ? 'dark-panel ' : '') + className}

    >
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {kicker && <div className="panel-context">{kicker}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Note({
  children,
  tone = '',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={'note ' + tone}>
      <Info size={16} />
      <div>{children}</div>
    </div>
  );
}
export function EvidenceButton({
  onClick,
  label = 'Inspect evidence',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="text-btn" onClick={onClick}>
      {label}
      <ArrowUpRight size={14} />
    </button>
  );
}
export function ExportLink({
  href,
  label = 'Export CSV',
}: {
  href: string;
  label?: string;
}) {
  return (
    <a className="secondary-btn" href={href} download>
      <Download size={15} />
      {label}
    </a>
  );
}
