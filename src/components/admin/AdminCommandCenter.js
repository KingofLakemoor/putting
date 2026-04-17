import React from 'react';
import { motion } from 'framer-motion';
import { Users, PlayCircle, Hash, Map, ShieldCheck } from 'lucide-react';

const AdminCommandCenter = ({ activeTab, setActiveTab }) => {
  const adminModules = [
    { id: 'players', label: 'Players', icon: Users, count: '124', color: 'text-blue-400' },
    { id: 'rounds', label: 'Rounds', icon: PlayCircle, count: '3 Live', color: 'text-kelly-green' },
    { id: 'scores', label: 'Scores', icon: Hash, count: '822', color: 'text-amber-400' },
    { id: 'courses', label: 'Courses', icon: Map, count: '4', color: 'text-purple-400' },
    { id: 'coordinators', label: 'Coordinators', icon: ShieldCheck, count: '6', color: 'text-red-400' },
  ];

  return (
    <div className="bg-dark-bg p-6 border-b border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="font-sports text-3xl uppercase tracking-tighter text-white">Admin Command Center</h1>
          <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest">System Control & League Oversight</p>
        </div>

        {/* Quick System Health Stats */}
        <div className="flex gap-4">
          <div className="bg-dark-surface border border-slate-800 px-4 py-2 rounded-lg">
             <p className="text-[9px] text-slate-500 uppercase font-bold">DB Status</p>
             <p className="text-xs text-kelly-green font-mono">CONNECTED</p>
          </div>
          <div className="bg-dark-surface border border-slate-800 px-4 py-2 rounded-lg">
             <p className="text-[9px] text-slate-500 uppercase font-bold">Latency</p>
             <p className="text-xs text-blue-400 font-mono">24ms</p>
          </div>
        </div>
      </div>

      {/* Modernized Module Toggles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {adminModules.map((module) => {
          const Icon = module.icon;
          const isActive = activeTab === module.id;

          return (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              key={module.id}
              onClick={() => setActiveTab(module.id)}
              className={`relative flex flex-col p-4 rounded-xl border transition-all duration-300 text-left
                ${isActive
                  ? 'bg-dark-surface border-kelly-green shadow-[0_0_15px_rgba(76,187,23,0.1)]'
                  : 'bg-dark-bg border-slate-800 hover:border-slate-700'}`}
            >
              <div className={`mb-3 ${isActive ? 'text-kelly-green' : 'text-slate-500'}`}>
                <Icon size={24} />
              </div>
              <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {module.label}
              </p>
              <p className="text-[10px] font-data text-slate-600 mt-1 uppercase">
                {module.count} Total
              </p>

              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-kelly-green rounded-b-xl"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCommandCenter;
