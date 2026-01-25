import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Swords,
    BarChart3,
    Clock,
    Zap,
    Filter,
    Activity
} from 'lucide-react';

const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'warroom', icon: Swords, label: 'War Room' },
    { id: 'narratives', icon: BarChart3, label: 'Narratives' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
    { id: 'signals', icon: Zap, label: 'Signals' },
    { id: 'noise', icon: Filter, label: 'Noise' },
];

export function Sidebar({ activeSection, onSectionChange }) {
    return (
        <aside className="sticky top-0 h-screen w-20 bg-gray-950/90 backdrop-blur-md border-r border-white/5 flex flex-col items-center py-6 z-50 flex-shrink-0">
            {/* Logo */}
            <div className="mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20"
                >
                    <Activity className="w-6 h-6 text-white" />
                </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map((item, index) => {
                    const isActive = activeSection === item.id;
                    const Icon = item.icon;

                    return (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            onClick={() => onSectionChange(item.id)}
                            className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group ${isActive
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                }`}
                        >
                            <Icon className="w-5 h-5" />

                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-r-full"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}

                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {item.label}
                            </div>

                            {/* Glow effect */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl bg-cyan-500/10 blur-xl" />
                            )}
                        </motion.button>
                    );
                })}
            </nav>

            {/* Footer marker */}
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </aside>
    );
}
