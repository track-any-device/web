'use client';

import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ArrowRight, BookOpen, Building2, Code, Cpu, Radio, Wrench } from 'lucide-react';
import Link from 'next/link';

const ICONS = { BookOpen, Building2, Code, Cpu, Radio, Wrench } as const;
export type IconName = keyof typeof ICONS;

type Tone = 'primary' | 'info' | 'success' | 'accent' | 'warning';

const TONE_BG: Record<Tone, string> = {
    primary: 'bg-primary/10 text-primary',
    info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    accent:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export interface DocCardProps {
    title:       string;
    description: string;
    href:        string;
    audience:    string;
    icon:        IconName;
    tone:        Tone;
    badge?:      string;
}

export default function DocCard({ title, description, href, audience, icon, tone, badge }: DocCardProps) {
    const Icon = ICONS[icon];
    return (
        <Link href={href} className="group block">
            <Card className="h-full border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start gap-4">
                    <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl', TONE_BG[tone])}>
                        <Icon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                            {badge && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{audience}</p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                            Read the manual <ArrowRight className="size-3.5" />
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
