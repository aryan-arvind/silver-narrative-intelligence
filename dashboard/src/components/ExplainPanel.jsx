/**
 * Enhanced Explain Panel with reactbits primitives
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Tag, FileText, Info, TrendingUp, TrendingDown } from 'lucide-react';
import {
    AnimatedCounter,
    SignalBar,
    GlowOrb,
    StageTag,
    SentimentBadge,
    MomentumArrow
} from './primitives';

export function ExplainPanel({ narrative, isOpen, onClose }) {
    if (!narrative) return null;

    // Generate keywords from narrative
    const keywords = [
        narrative.name.split(' ')[0],
        narrative.sentiment,
        narrative.stage,
        'Silver',
        'Market',
        narrative.momentum === '+' ? 'Rising' : 'Declining'
    ];

    const headlines = [
        `${narrative.name} drives silver market sentiment`,
        `Analysts highlight ${narrative.name.toLowerCase()} as key factor`,
        `${narrative.sentiment} outlook on silver amid ${narrative.name.toLowerCase()}`,
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-[480px] bg-gray-950/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 p-6 border-b border-white/10 bg-gray-950/90 backdrop-blur-md">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-mono text-cyan-400/60">{narrative.id}</span>
                                        <GlowOrb sentiment={narrative.sentiment} size="sm" />
                                        <MomentumArrow direction={narrative.momentum} size="md" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">{narrative.name}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 mt-4">
                                <SentimentBadge sentiment={narrative.sentiment} size="md" />
                                <StageTag stage={narrative.stage} size="md" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Strength Meter */}
                            <div className="bg-gray-900/60 rounded-2xl border border-white/5 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-400">Signal Strength</span>
                                    <span className="text-3xl font-bold text-cyan-400">
                                        <AnimatedCounter value={narrative.strength} suffix="%" />
                                    </span>
                                </div>
                                <SignalBar
                                    value={narrative.strength}
                                    color={narrative.strength > 60 ? 'cyan' : 'emerald'}
                                    height="lg"
                                    showGlow={narrative.strength > 60}
                                />
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <MetricCard
                                    label="Coherence"
                                    value={Math.round(narrative.coherence * 100)}
                                    color="teal"
                                />
                                <MetricCard
                                    label="Persistence"
                                    value={Math.round(narrative.persistence * 100)}
                                    color="purple"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <SectionHeader icon={Info} label="Analysis" />
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    {narrative.description}
                                </p>
                            </div>

                            {/* Keywords */}
                            <div>
                                <SectionHeader icon={Tag} label="Top Keywords" />
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map((keyword, i) => (
                                        <motion.span
                                            key={keyword}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="px-3 py-1.5 bg-gray-800/80 rounded-xl text-sm text-gray-300 border border-gray-700/50"
                                        >
                                            {keyword}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            {/* Sample Headlines */}
                            <div>
                                <SectionHeader icon={FileText} label="Sample Headlines" />
                                <div className="space-y-2">
                                    {headlines.map((headline, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-3 bg-gray-900/50 rounded-xl border-l-2 border-cyan-500/50"
                                        >
                                            <p className="text-sm text-gray-300">{headline}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Classification Reason */}
                            <div>
                                <SectionHeader icon={Zap} label={`Why ${narrative.sentiment}?`} />
                                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                                        This narrative is classified as{' '}
                                        <span className={
                                            narrative.sentiment === 'Bullish' ? 'text-emerald-400' :
                                                narrative.sentiment === 'Bearish' ? 'text-red-400' :
                                                    'text-amber-400'
                                        }>
                                            {narrative.sentiment}
                                        </span>{' '}
                                        based on:
                                    </p>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <ReasonItem text={`Coherence score of ${Math.round(narrative.coherence * 100)}%`} />
                                        <ReasonItem text={`Persistence across ${narrative.timeline?.length || 0} time periods`} />
                                        <ReasonItem text={`${narrative.momentum === '+' ? 'Positive' : 'Negative'} momentum trend`} />
                                    </ul>
                                </div>
                            </div>

                            {/* Sources */}
                            <div className="text-xs text-gray-500 pt-4 border-t border-gray-800">
                                Sources: <span className="text-cyan-400">{narrative.sources?.join(', ')}</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function MetricCard({ label, value, color }) {
    const colors = {
        teal: 'text-teal-400',
        purple: 'text-purple-400',
        cyan: 'text-cyan-400',
    };

    return (
        <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${colors[color]}`}>
                <AnimatedCounter value={value} suffix="%" />
            </div>
        </div>
    );
}

function SectionHeader({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">{label}</span>
        </div>
    );
}

function ReasonItem({ text }) {
    return (
        <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            {text}
        </li>
    );
}
