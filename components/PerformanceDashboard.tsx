'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

interface PerformanceStats {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  activeRequests: number;
}

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    activeRequests: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Collect initial performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setStats((prev) => ({
          ...prev,
          pageLoadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          renderTime: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        }));
      }
    }

    // Monitor performance over time
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const entries = performance.getEntriesByType('measure');
        const latestMeasures = entries.slice(-10);
        const avgTime = latestMeasures.length > 0
          ? Math.round(
              latestMeasures.reduce((sum, e) => sum + e.duration, 0) / latestMeasures.length
            )
          : 0;

        setStats((prev) => ({
          ...prev,
          apiResponseTime: avgTime,
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    unit,
    color,
  }: {
    icon: any;
    label: string;
    value: number;
    unit: string;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg bg-gradient-to-br from-${color}/10 to-transparent border border-${color}/30`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold text-${color}`}>
            {value}
            <span className="text-xs ml-1">{unit}</span>
          </p>
        </div>
        <Icon className={`w-8 h-8 text-${color} opacity-50`} />
      </div>
    </motion.div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Activity className="w-5 h-5" />
      </motion.button>

      {/* Panel */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="absolute bottom-16 right-0 w-80 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl p-4 space-y-3"
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance Metrics
          </h3>

          <div className="space-y-3">
            <MetricCard
              icon={Clock}
              label="Page Load"
              value={stats.pageLoadTime}
              unit="ms"
              color="blue"
            />
            <MetricCard
              icon={TrendingUp}
              label="API Response"
              value={stats.apiResponseTime}
              unit="ms"
              color="green"
            />
            <MetricCard
              icon={Activity}
              label="Render Time"
              value={stats.renderTime}
              unit="ms"
              color="purple"
            />
          </div>

          <div className="text-xs text-gray-400 pt-3 border-t border-white/10">
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default PerformanceDashboard;
