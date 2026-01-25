/**
 * Enhanced Overview View with reactbits primitives
 */

import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { SignalCard } from '../components/SignalCard';
import {
    AnimatedCounter,
    PulseRing,
    GlowCard
} from '../components/primitives';

export function OverviewView({ narratives, metadata, onNarrativeClick }) {
    const activeNarratives = narratives.filter(n => n.strength > 15);
    const dominantNarratives = narratives.filter(n => n.strength > 60);
    const top5 = activeNarratives.slice(0, 5);

    // Calculate market bias
    const sentimentWeights = { Bullish: 0, Bearish: 0, Neutral: 0 };
    narratives.forEach(n => sentimentWeights[n.sentiment] += n.strength);
    const marketBias = sentimentWeights.Bullish > sentimentWeights.Bearish ? 'Bullish' :
        sentimentWeights.Bearish > sentimentWeights.Bullish ? 'Bearish' : 'Neutral';

    const avgStrength = Math.round(activeNarratives.reduce((sum, n) => sum + n.strength, 0) / activeNarratives.length);

    return (
        <div className="space-y-8">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={Activity}
                    label="Active Narratives"
                    value={activeNarratives.length}
                    color="cyan"
                    delay={0}
                />
                <StatCard
                    icon={Zap}
                    label="Dominant Signals"
                    value={dominantNarratives.length}
                    color="emerald"
                    delay={0.1}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Market Bias"
                    textValue={marketBias}
                    color={marketBias === 'Bullish' ? 'emerald' : marketBias === 'Bearish' ? 'red' : 'amber'}
                    delay={0.2}
                />
                <StatCard
                    icon={BarChart3}
                    label="Avg Strength"
                    value={avgStrength}
                    suffix="%"
                    color="purple"
                    delay={0.3}
                />
            </div>

            {/* Top 5 Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Top Intelligence Signals</h2>
                    <p className="text-gray-400 mt-1">
                        Showing top 5 of <span className="text-cyan-400 font-semibold">{activeNarratives.length}</span> active narratives
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-800">
                    <PulseRing color="emerald" size="sm" active />
                    <span className="text-sm text-gray-400">Live Intelligence</span>
                </div>
            </div>

            {/* Top 5 Signal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {top5.map((narrative, index) => (
                    <SignalCard
                        key={narrative.id}
                        narrative={narrative}
                        index={index}
                        onClick={onNarrativeClick}
                    />
                ))}
            </div>

            {/* Secondary Signals */}
            {activeNarratives.length > 5 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-4">Other Active Signals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {activeNarratives.slice(5, 13).map((narrative, index) => (
                            <motion.div
                                key={narrative.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.03 }}
                                onClick={() => onNarrativeClick?.(narrative)}
                                className="p-4 bg-gray-900/40 rounded-xl border border-gray-800/50 hover:border-cyan-500/20 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors truncate">
                                        {narrative.name}
                                    </span>
                                    <span className={`text-lg font-bold ${narrative.momentum === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <AnimatedCounter value={narrative.strength} suffix="%" delay={0.4 + index * 0.02} />
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${narrative.strength}%` }}
                                        transition={{ delay: 0.5 + index * 0.02, duration: 0.5 }}
                                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, textValue, suffix = '', color, delay }) {
    const colorClasses = {
        cyan: { bg: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: 'text-cyan-400' },
        emerald: { bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' },
        amber: { bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' },
        red: { bg: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' },
        purple: { bg: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400' },
    };

    const c = colorClasses[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`p-5 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} backdrop-blur-sm`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gray-900/50 flex items-center justify-center ${c.icon}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-400">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${c.text}`}>
                {textValue ? (
                    textValue
                ) : (
                    <AnimatedCounter value={value} suffix={suffix} delay={delay + 0.2} />
                )}
            </div>
        </motion.div>
    );
}
