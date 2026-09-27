/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    type: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export default function DashboardCard({ title, value, description, icon: Icon, trend }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Upper row header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
            {title}
          </span>
          <h3 className="font-mono font-bold text-navy-950 text-xl sm:text-2xl tracking-tight mt-1.5 mb-1 leading-tight">
            {value}
          </h3>
        </div>
        
        {/* Decorative Glossy Icon Box */}
        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100/50">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Footer descriptor & trend indicators */}
      <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between text-xs select-none">
        <span className="text-slate-400 font-medium text-[11px] leading-relaxed">
          {description}
        </span>

        {trend && (
          <div className={`flex items-center space-x-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full ${
            trend.type === 'up' 
              ? 'bg-emerald-50 text-emerald-600' 
              : trend.type === 'down' 
                ? 'bg-red-50 text-red-600' 
                : 'bg-slate-100 text-slate-500'
          }`}>
            {trend.type === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend.type === 'down' && <TrendingDown className="h-3 w-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
