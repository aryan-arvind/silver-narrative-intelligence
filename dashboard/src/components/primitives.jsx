/**
 * Reactbits-inspired animated UI primitives
 * Animated counters, pulse effects, glow orbs, and signal bars
 */

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// ============================================
// ANIMATED COUNTER - reactbits CountUp style
// ============================================
export function AnimatedCounter({
    value,
    duration = 1,
    suffix = '%',
    className = '',
    delay = 0
}) {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);

    useEffect(() => {
        const controls = animate(prevValue.current, value, {
            duration,
            delay,
            onUpdate: (v) => setDisplayValue(Math.round(v)),
        });
        prevValue.current = value;
        return () => controls.stop();
    }, [value, duration, delay]);

    return (
        <span className={`font-mono tabular-nums ${className}`}>
            {displayValue}{suffix}
        </span>
    );
}

// ============================================
// PULSE RING - animated status indicator
// ============================================
export function PulseRing({
    color = 'cyan',
    size = 'md',
    active = true
}) {
    const sizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const colors = {
        cyan: 'bg-cyan-400',
        emerald: 'bg-emerald-400',
        amber: 'bg-amber-400',
        red: 'bg-red-400',
        purple: 'bg-purple-400',
    };

    const glowColors = {
        cyan: 'shadow-cyan-400/50',
        emerald: 'shadow-emerald-400/50',
        amber: 'shadow-amber-400/50',
        red: 'shadow-red-400/50',
        purple: 'shadow-purple-400/50',
    };

    return (
        <div className={`relative ${sizes[size]}`}>
            <div className={`absolute inset-0 rounded-full ${colors[color]} ${active ? 'animate-ping opacity-75' : ''}`} />
            <div className={`relative rounded-full ${sizes[size]} ${colors[color]} shadow-lg ${glowColors[color]}`} />
        </div>
    );
}

// ============================================
// GLOW ORB - sentiment indicator orb
// ============================================
export function GlowOrb({
    sentiment,
    size = 'md',
    animate: shouldAnimate = true
}) {
    const sentimentConfig = {
        Bullish: {
            bg: 'bg-emerald-500',
            glow: 'shadow-emerald-500/60',
            ring: 'ring-emerald-400/30'
        },
        Bearish: {
            bg: 'bg-red-500',
            glow: 'shadow-red-500/60',
            ring: 'ring-red-400/30'
        },
        Neutral: {
            bg: 'bg-amber-500',
            glow: 'shadow-amber-500/60',
            ring: 'ring-amber-400/30'
        },
    };

    const sizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const config = sentimentConfig[sentiment] || sentimentConfig.Neutral;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`relative ${sizes[size]}`}
        >
            {shouldAnimate && (
                <div className={`absolute inset-0 rounded-full ${config.bg} opacity-40 animate-ping`} />
            )}
            <div
                className={`
          relative rounded-full ${sizes[size]} ${config.bg} 
          shadow-lg ${config.glow} 
          ring-2 ${config.ring}
        `}
            />
        </motion.div>
    );
}

// ============================================
// SIGNAL BAR - animated progress bar
// ============================================
export function SignalBar({
    value,
    maxValue = 100,
    color = 'cyan',
    height = 'md',
    delay = 0,
    showGlow = false
}) {
    const percentage = (value / maxValue) * 100;

    const heights = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const gradients = {
        cyan: 'from-cyan-500 to-teal-400',
        emerald: 'from-emerald-500 to-green-400',
        amber: 'from-amber-500 to-yellow-400',
        red: 'from-red-500 to-rose-400',
        purple: 'from-purple-500 to-violet-400',
    };

    return (
        <div className={`w-full ${heights[height]} bg-gray-800 rounded-full overflow-hidden relative`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                className={`
          ${heights[height]} rounded-full 
          bg-gradient-to-r ${gradients[color]}
          ${showGlow ? 'shadow-lg shadow-current' : ''}
        `}
            />
            {showGlow && percentage > 60 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 bg-gradient-to-r ${gradients[color]} blur-sm opacity-30`}
                />
            )}
        </div>
    );
}

// ============================================
// MOMENTUM ARROW - animated directional indicator
// ============================================
export function MomentumArrow({ direction = '+', size = 'md' }) {
    const sizes = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-xl',
    };

    const isUp = direction === '+';

    return (
        <motion.span
            initial={{ y: isUp ? 5 : -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`
        ${sizes[size]} font-bold
        ${isUp ? 'text-emerald-400' : 'text-red-400'}
      `}
        >
            {isUp ? '↑' : '↓'}
        </motion.span>
    );
}

// ============================================
// STAGE TAG - lifecycle stage with colors
// ============================================
export function StageTag({ stage, size = 'md' }) {
    const config = {
        Emerging: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
        Expanding: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        Peak: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
        Fading: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    };

    const sizes = {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    const c = config[stage] || config.Emerging;

    return (
        <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
        ${sizes[size]} ${c.bg} ${c.text} 
        border ${c.border}
        rounded-full font-medium
      `}
        >
            {stage}
        </motion.span>
    );
}

// ============================================
// SENTIMENT BADGE - sentiment indicator badge
// ============================================
export function SentimentBadge({ sentiment, size = 'md' }) {
    const config = {
        Bullish: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        Bearish: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
        Neutral: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    };

    const sizes = {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    const c = config[sentiment] || config.Neutral;

    return (
        <span className={`${sizes[size]} ${c.bg} ${c.text} border ${c.border} rounded-full font-medium`}>
            {sentiment}
        </span>
    );
}

// ============================================
// GLOW CARD - card with conditional glow
// ============================================
export function GlowCard({
    children,
    glowColor = 'cyan',
    glow = false,
    className = ''
}) {
    const glowStyles = {
        cyan: 'shadow-cyan-500/20 border-cyan-500/30',
        emerald: 'shadow-emerald-500/20 border-emerald-500/30',
        amber: 'shadow-amber-500/20 border-amber-500/30',
        purple: 'shadow-purple-500/20 border-purple-500/30',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`
        bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5
        ${glow ? `shadow-xl ${glowStyles[glowColor]}` : ''}
        transition-all duration-300
        ${className}
      `}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// STAT DISPLAY - large animated stat
// ============================================
export function StatDisplay({
    value,
    label,
    color = 'cyan',
    suffix = '',
    isAnimated = true
}) {
    const colors = {
        cyan: 'text-cyan-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        red: 'text-red-400',
        purple: 'text-purple-400',
    };

    return (
        <div className="text-center">
            <div className={`text-4xl font-bold ${colors[color]}`}>
                {isAnimated ? (
                    <AnimatedCounter value={value} suffix={suffix} />
                ) : (
                    <span>{value}{suffix}</span>
                )}
            </div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
    );
}

// ============================================
// HEATMAP CELL - individual heat cell
// ============================================
export function HeatmapCell({
    value,
    sentiment,
    delay = 0,
    onClick
}) {
    const intensity = Math.min(value / 100, 1);

    const sentimentColors = {
        Bullish: `rgba(16, 185, 129, ${0.2 + intensity * 0.6})`,
        Bearish: `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`,
        Neutral: `rgba(245, 158, 11, ${0.2 + intensity * 0.6})`,
    };

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            onClick={onClick}
            className="w-full h-8 rounded-md cursor-pointer transition-transform"
            style={{ backgroundColor: sentimentColors[sentiment] || sentimentColors.Neutral }}
        />
    );
}
