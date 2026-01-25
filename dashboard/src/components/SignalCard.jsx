/**
 * Enhanced SignalCard using reactbits-inspired primitives
 */

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import {
    AnimatedCounter,
    GlowOrb,
    SignalBar,
    MomentumArrow,
    StageTag,
    SentimentBadge,
    GlowCard
} from './primitives';

export function SignalCard({ narrative, index = 0, onClick }) {
    const isDominant = narrative.strength > 60;

    return (
        <GlowCard
            glow={isDominant}
            glowColor="cyan"
            className="p-5 cursor-pointer group"
        >
            <div onClick={() => onClick?.(narrative)}>
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono text-cyan-400/60">{narrative.id}</span>
                            <GlowOrb sentiment={narrative.sentiment} size="sm" />
                            <MomentumArrow direction={narrative.momentum} size="sm" />
                        </div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                            {narrative.name}
                        </h3>
                    </div>
                </div>

                {/* Tags Row */}
                <div className="flex items-center gap-2 mb-4">
                    <SentimentBadge sentiment={narrative.sentiment} size="sm" />
                    <StageTag stage={narrative.stage} size="sm" />
                </div>

                {/* Strength Display */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Signal Strength</span>
                        <div className="text-2xl font-bold text-cyan-400">
                            <AnimatedCounter
                                value={narrative.strength}
                                delay={index * 0.05}
                                suffix="%"
                            />
                        </div>
                    </div>
                    <SignalBar
                        value={narrative.strength}
                        color={isDominant ? 'cyan' : narrative.strength > 30 ? 'emerald' : 'amber'}
                        height="md"
                        delay={index * 0.05}
                        showGlow={isDominant}
                    />
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                        <div className="text-[10px] text-gray-500 mb-0.5">Coherence</div>
                        <div className="text-sm font-semibold text-teal-400">
                            <AnimatedCounter
                                value={Math.round(narrative.coherence * 100)}
                                delay={index * 0.05 + 0.1}
                                suffix="%"
                            />
                        </div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                        <div className="text-[10px] text-gray-500 mb-0.5">Persistence</div>
                        <div className="text-sm font-semibold text-purple-400">
                            <AnimatedCounter
                                value={Math.round(narrative.persistence * 100)}
                                delay={index * 0.05 + 0.15}
                                suffix="%"
                            />
                        </div>
                    </div>
                </div>

                {/* Sources */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <Zap className="w-3 h-3 text-cyan-500/50" />
                    <span>{narrative.sources?.slice(0, 2).join(' • ')}</span>
                </div>
            </div>
        </GlowCard>
    );
}

export function SignalCardCompact({ narrative, index = 0, onClick }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onClick?.(narrative)}
            className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800/50 hover:border-cyan-500/20 cursor-pointer transition-all group"
        >
            <GlowOrb sentiment={narrative.sentiment} size="sm" animate={narrative.strength > 50} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors truncate">
                        {narrative.name}
                    </span>
                    <MomentumArrow direction={narrative.momentum} size="sm" />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                    <SentimentBadge sentiment={narrative.sentiment} size="sm" />
                    <StageTag stage={narrative.stage} size="sm" />
                </div>
            </div>

            <div className="text-right">
                <div className="text-xl font-bold text-cyan-400">
                    <AnimatedCounter value={narrative.strength} suffix="%" />
                </div>
            </div>
        </motion.div>
    );
}
