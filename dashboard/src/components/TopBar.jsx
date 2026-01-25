import { motion } from 'framer-motion';
import { RefreshCw, Clock, Database, Radio } from 'lucide-react';

const sourceChips = [
    { name: 'Reddit', color: 'bg-orange-500/20 text-orange-400' },
    { name: 'Bloomberg', color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Reuters', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'News API', color: 'bg-teal-500/20 text-teal-400' },
];

export function TopBar({
    lastUpdated,
    onRefresh,
    loading,
    demoMode,
    onDemoModeToggle,
    metadata
}) {
    const formatTime = (date) => {
        if (!date) return '--:--:--';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 h-16 bg-gray-950/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-40 flex-shrink-0"
        >
            {/* Left: Sources */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Database className="w-4 h-4" />
                    <span>Sources:</span>
                </div>
                <div className="flex items-center gap-2">
                    {sourceChips.map((source, i) => (
                        <motion.span
                            key={source.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${source.color} flex items-center gap-1`}
                        >
                            <Radio className="w-2.5 h-2.5 animate-pulse" />
                            {source.name}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-6">
                {/* Stats */}
                {metadata && (
                    <div className="flex items-center gap-4 text-sm">
                        <div className="text-gray-400">
                            <span className="text-cyan-400 font-bold">{metadata.active_narratives}</span> Active
                        </div>
                        <div className="w-px h-4 bg-gray-700" />
                        <div className="text-gray-400">
                            <span className="text-emerald-400 font-bold">{metadata.dominant_narratives}</span> Dominant
                        </div>
                    </div>
                )}

                {/* Demo Mode Toggle */}
                <button
                    onClick={onDemoModeToggle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${demoMode
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                        }`}
                >
                    {demoMode ? 'DEMO MODE' : 'LIVE'}
                </button>

                {/* Last Updated */}
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(lastUpdated)}</span>
                </div>

                {/* Refresh Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRefresh}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-medium flex items-center gap-2 hover:from-cyan-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </motion.button>
            </div>
        </motion.header>
    );
}
