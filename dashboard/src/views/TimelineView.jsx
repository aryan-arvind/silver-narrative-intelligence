/**
 * Enhanced Timeline View with lifecycle stages
 */

import { motion } from 'framer-motion';
import {
    AnimatedCounter,
    MomentumArrow,
    StageTag,
    SignalBar
} from '../components/primitives';

const stageConfig = {
    Emerging: { position: 12.5, color: 'cyan' },
    Expanding: { position: 37.5, color: 'emerald' },
    Peak: { position: 62.5, color: 'amber' },
    Fading: { position: 87.5, color: 'red' },
};

export function TimelineView({ narratives, onNarrativeClick }) {
    const activeNarratives = narratives
        .filter(n => n.strength > 15)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 12);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Narrative Lifecycle</h2>
                <p className="text-gray-400 mt-1">Track narrative progression through lifecycle stages</p>
            </div>

            {/* Stage Legend */}
            <div className="flex items-center justify-between p-4 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5">
                <div className="flex items-center gap-8">
                    {Object.entries(stageConfig).map(([stage, config]) => (
                        <div key={stage} className="flex items-center gap-2">
                            <StageTag stage={stage} size="sm" />
                        </div>
                    ))}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>Lifecycle Progress</span>
                    <span className="text-cyan-400">→</span>
                </div>
            </div>

            {/* Timeline Tracks */}
            <div className="space-y-3">
                {activeNarratives.map((narrative, index) => {
                    const stage = stageConfig[narrative.stage] || stageConfig.Emerging;

                    return (
                        <motion.div
                            key={narrative.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            onClick={() => onNarrativeClick?.(narrative)}
                            className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-4 cursor-pointer hover:border-cyan-500/20 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                {/* Narrative Info */}
                                <div className="w-48 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">{narrative.name}</span>
                                        <MomentumArrow direction={narrative.momentum} size="sm" />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Strength: <AnimatedCounter value={narrative.strength} suffix="%" delay={index * 0.04} />
                                    </div>
                                </div>

                                {/* Timeline Bar */}
                                <div className="flex-1 relative h-10">
                                    {/* Track Background */}
                                    <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                                        <div className="w-full h-2 bg-gray-800 rounded-full relative">
                                            {/* Stage Dividers */}
                                            <div className="absolute inset-0 flex">
                                                <div className="w-1/4 border-r border-gray-700/50" />
                                                <div className="w-1/4 border-r border-gray-700/50" />
                                                <div className="w-1/4 border-r border-gray-700/50" />
                                                <div className="w-1/4" />
                                            </div>

                                            {/* Progress Fill */}
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stage.position + 10}%` }}
                                                transition={{ delay: index * 0.04 + 0.2, duration: 0.6, ease: 'easeOut' }}
                                                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${stage.color === 'cyan' ? 'from-cyan-600 to-cyan-400' :
                                                        stage.color === 'emerald' ? 'from-emerald-600 to-emerald-400' :
                                                            stage.color === 'amber' ? 'from-amber-600 to-amber-400' :
                                                                'from-red-600 to-red-400'
                                                    }`}
                                            />

                                            {/* Position Indicator */}
                                            <motion.div
                                                initial={{ left: 0, opacity: 0, scale: 0 }}
                                                animate={{ left: `${stage.position}%`, opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.04 + 0.3, duration: 0.4, type: 'spring' }}
                                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                                style={{ left: `${stage.position}%` }}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 border-gray-900 shadow-lg ${stage.color === 'cyan' ? 'bg-cyan-400' :
                                                        stage.color === 'emerald' ? 'bg-emerald-400' :
                                                            stage.color === 'amber' ? 'bg-amber-400' :
                                                                'bg-red-400'
                                                    }`} />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stage Label */}
                                <div className="w-24 text-right">
                                    <StageTag stage={narrative.stage} size="md" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
