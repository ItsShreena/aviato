/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plane, Map, ShieldAlert, Award, Database, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: 'flights', label: 'Flights Directory', icon: Plane, countStr: 'Active' },
    { id: 'airports', label: 'Airports Index', icon: Map, countStr: '8 Hubs' },
    { id: 'bookings', label: 'Bookings List', icon: Database, countStr: 'Booked' },
    { id: 'analytics', label: 'Insights & Stats', icon: BarChart3, countStr: 'Metrics' },
  ];

  return (
    <aside id="admin-sidebar" className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm w-full lg:w-64 h-fit shrink-0 select-none">
      {/* Sidebar branding */}
      <div className="px-3 py-4 border-b border-slate-100 mb-4 text-left">
        <h3 className="font-display font-extrabold text-navy-950 text-sm tracking-widest uppercase">
          AVIATO ADMIN
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
          Administration Panel
        </p>
      </div>

      {/* Nav Menu */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 text-left ${
                isActive
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-950 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-sky-450' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isActive ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-100 text-slate-400'
              }`}>
                {item.countStr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom informational card */}
      <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 font-semibold text-sky-600 p-2 bg-sky-50/50 rounded-xl border border-sky-100/30">
          <Award className="h-3.5 w-3.5 shrink-0" />
          <span>Sandbox Mode Active</span>
        </div>
        <p className="px-2 pt-2 leading-relaxed">
          You are editing administrative records. Refreshing the application will restore the default presets.
        </p>
      </div>
    </aside>
  );
}
