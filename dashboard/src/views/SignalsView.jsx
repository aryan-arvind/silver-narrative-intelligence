/**
 * Enhanced Signals View with top 5 focus
 */

import { motion } from 'framer-motion';
import { SignalCard } from '../components/SignalCard';
import { AnimatedCounter, PulseRing } from '../components/primitives';

export function SignalsView({ narratives, onNarrativeClick }) {
    const activeNarratives = narratives
        .filter(n => n.strength > 15)
        .sort((a, b) => b.strength - a.strength);

    const top5 = activeNarratives.slice(0, 5);
    const remaining = activeNarratives.slice(5);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Signal Intelligence</h2>
                    <p className="text-gray-400 mt-1">
                        Showing top 5 of <span className="text-cyan-400 font-semibold">{activeNarratives.length}</span> active narratives
                    </p>
                </div>
                {remaining.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <PulseRing color="cyan" size="sm" />
                        <span>+{remaining.length} more signals</span>
                    </div>
                )}
            </div>

            {/* Top 5 Cards Grid */}
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

            {/* Remaining Active Signals */}
            {remaining.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4">Additional Signals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {remaining.map((narrative, index) => (
                            <motion.div
                                key={narrative.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.02 }}
                                onClick={() => onNarrativeClick?.(narrative)}
                                className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50 hover:border-cyan-500/20 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors truncate">
                                        {narrative.name}
                                    </span>
                                    <span className={`text-sm font-bold ${narrative.momentum === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <AnimatedCounter value={narrative.strength} suffix="%" delay={0.4 + index * 0.01} />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
