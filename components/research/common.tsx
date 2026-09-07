'use client';
import type { ReactNode } from 'react';
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
  return (
    <Tabs value={value} onValueChange={(v) => onChange(String(v))}>
      <TabsList variant="default" className="workspace-tabs">
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
      onPointerMove={(event) => {
        if (
          event.pointerType !== 'mouse' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
          return;
        const el = event.currentTarget;
        const box = el.getBoundingClientRect();
        el.style.setProperty(
          '--surface-x',
          `${((event.clientY - box.top) / box.height - 0.5) * -1.4}deg`,
        );
        el.style.setProperty(
          '--surface-y',
          `${((event.clientX - box.left) / box.width - 0.5) * 1.4}deg`,
        );
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty('--surface-x', '0deg');
        event.currentTarget.style.setProperty('--surface-y', '0deg');
      }}
    >
      <div className="section-heading">
        <div>
          {kicker && <div className="eyebrow">{kicker}</div>}
          <h2>{title}</h2>
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
