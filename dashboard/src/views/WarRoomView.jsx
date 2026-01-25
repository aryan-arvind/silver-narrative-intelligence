/**
 * Enhanced War Room View with heatmap grid
 */

import { motion } from 'framer-motion';
import { HeatmapCell, AnimatedCounter, PulseRing } from '../components/primitives';

const last7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            full: d.toISOString().split('T')[0],
            short: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
        });
    }
    return days;
};

export function WarRoomView({ narratives, onNarrativeClick }) {
    const activeNarratives = narratives
        .filter(n => n.strength > 15)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 15);

    const days = last7Days();
    const dominant = narratives.filter(n => n.strength > 60).length;
    const active = narratives.filter(n => n.strength > 20 && n.strength <= 60).length;
    const emerging = narratives.filter(n => n.strength <= 20).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">War Room</h2>
                    <p className="text-gray-400 mt-1">Narrative intelligence heatmap matrix</p>
                </div>
                <div className="flex items-center gap-6 text-xs">
                    <LegendItem color="emerald" label="Bullish" />
                    <LegendItem color="amber" label="Neutral" />
                    <LegendItem color="red" label="Bearish" />
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Header Row */}
                    <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}>
                        <div className="text-xs text-gray-500 font-medium">Narrative</div>
                        {days.map(day => (
                            <div key={day.full} className="text-xs text-gray-500 text-center font-medium">
                                {day.short}
                            </div>
                        ))}
                    </div>

                    {/* Narrative Rows */}
                    {activeNarratives.map((narrative, rowIndex) => (
                        <motion.div
                            key={narrative.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: rowIndex * 0.03 }}
                            className="grid gap-2 mb-2 items-center"
                            style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}
                        >
                            <div
                                className="text-sm text-gray-300 truncate pr-2 cursor-pointer hover:text-cyan-400 transition-colors"
                                onClick={() => onNarrativeClick?.(narrative)}
                            >
                                {narrative.name}
                            </div>
                            {days.map((day, colIndex) => {
                                const isActive = narrative.timeline?.includes(day.full);
                                return (
                                    <HeatmapCell
                                        key={day.full}
                                        value={isActive ? narrative.strength : 10}
                                        sentiment={narrative.sentiment}
                                        delay={rowIndex * 0.02 + colIndex * 0.01}
                                        onClick={() => onNarrativeClick?.(narrative)}
                                    />
                                );
                            })}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Distribution Stats */}
            <div className="grid grid-cols-3 gap-4">
                <DistributionCard
                    label="Dominant"
                    sublabel=">60% strength"
                    value={dominant}
                    color="emerald"
                    delay={0}
                />
                <DistributionCard
                    label="Active"
                    sublabel="20-60% strength"
                    value={active}
                    color="cyan"
                    delay={0.1}
                />
                <DistributionCard
                    label="Emerging"
                    sublabel="<20% strength"
                    value={emerging}
                    color="gray"
                    delay={0.2}
                />
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    const colors = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        gray: 'bg-gray-500',
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${colors[color]}`} />
            <span className="text-gray-400">{label}</span>
        </div>
    );
}

function DistributionCard({ label, sublabel, value, color, delay }) {
    const colorClasses = {
        emerald: 'text-emerald-400',
        cyan: 'text-cyan-400',
        gray: 'text-gray-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5"
        >
            <div className="flex items-center gap-2 mb-2">
                <PulseRing color={color === 'gray' ? 'cyan' : color} size="sm" active={value > 0} />
                <span className="text-sm text-gray-400">{label}</span>
            </div>
            <div className={`text-4xl font-bold ${colorClasses[color]}`}>
                <AnimatedCounter value={value} suffix="" delay={delay + 0.2} />
            </div>
            <div className="text-xs text-gray-600 mt-1">{sublabel}</div>
        </motion.div>
    );
}
