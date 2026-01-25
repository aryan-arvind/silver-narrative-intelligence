/**
 * Enhanced Narratives List View
 */

import { motion } from 'framer-motion';
import { SignalCardCompact } from '../components/SignalCard';
import { AnimatedCounter, PulseRing } from '../components/primitives';

export function NarrativesView({ narratives, onNarrativeClick }) {
    const sortedNarratives = [...narratives].sort((a, b) => b.strength - a.strength);
    const dominant = narratives.filter(n => n.strength > 60).length;
    const active = narratives.filter(n => n.strength > 15).length;
    const weak = narratives.filter(n => n.strength <= 15).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">All Narratives</h2>
                <p className="text-gray-400 mt-1">
                    <AnimatedCounter value={narratives.length} suffix="" /> total narratives tracked
                </p>
            </div>

            {/* Filter Stats */}
            <div className="flex items-center gap-4">
                <FilterChip color="emerald" count={dominant} label="Dominant" />
                <FilterChip color="cyan" count={active} label="Active" />
                <FilterChip color="gray" count={weak} label="Weak" />
            </div>

            {/* Narratives List */}
            <div className="space-y-3">
                {sortedNarratives.map((narrative, index) => (
                    <motion.div
                        key={narrative.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={narrative.strength <= 15 ? 'opacity-50' : ''}
                    >
                        <SignalCardCompact
                            narrative={narrative}
                            index={index}
                            onClick={onNarrativeClick}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function FilterChip({ color, count, label }) {
    const colors = {
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        gray: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${colors[color]}`}>
            <PulseRing color={color === 'gray' ? 'cyan' : color} size="sm" active={count > 0} />
            <span className="font-bold"><AnimatedCounter value={count} suffix="" /></span>
            <span className="text-gray-500 text-sm">{label}</span>
        </div>
    );
}
