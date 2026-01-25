/**
 * Enhanced Noise View
 */

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { AnimatedCounter, StageTag, SentimentBadge } from '../components/primitives';

export function NoiseView({ narratives }) {
    const weakNarratives = narratives.filter(n => n.strength <= 15);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Filtered Noise</h2>
                <p className="text-gray-400 mt-1">
                    Signals below 15% strength threshold — tracked but not actionable
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-500/10 border border-gray-500/20">
                    <span className="text-2xl font-bold text-gray-400">
                        <AnimatedCounter value={weakNarratives.length} suffix="" />
                    </span>
                    <span className="text-sm text-gray-500">Weak Signals</span>
                </div>
            </div>

            {weakNarratives.length === 0 ? (
                <div className="bg-gray-900/60 rounded-2xl border border-white/5 p-8 text-center">
                    <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <div className="text-gray-500">No weak signals currently detected</div>
                </div>
            ) : (
                <div className="space-y-3">
                    {weakNarratives.map((narrative, index) => (
                        <motion.div
                            key={narrative.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 opacity-60"
                        >
                            <div className="flex items-center gap-4">
                                <AlertTriangle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-400">{narrative.name}</span>
                                        <span className="text-xs text-gray-600">
                                            Strength: <AnimatedCounter value={narrative.strength} suffix="%" />
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 truncate">
                                        {narrative.description?.slice(0, 100)}...
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <SentimentBadge sentiment={narrative.sentiment} size="sm" />
                                    <StageTag stage={narrative.stage} size="sm" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
