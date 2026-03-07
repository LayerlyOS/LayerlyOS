'use client';

import { motion } from 'framer-motion';
import { UserPlus, Printer, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'user_joined' | 'print_created';
  title: string;
  subtitle: string;
  date: Date;
  user?: string;
}

export function AdminRecentActivity({ users, prints }: { users: any[]; prints: any[] }) {
  const activities: ActivityItem[] = [
    ...users.map(u => ({
      id: u.id,
      type: 'user_joined' as const,
      title: 'New user',
      subtitle: u.name || u.email,
      date: new Date(u.createdAt),
      user: u.image
    })),
    ...prints.map(p => ({
      id: p.id,
      type: 'print_created' as const,
      title: 'Print created',
      subtitle: p.name,
      date: new Date(p.createdAt),
      user: p.user?.image
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 7);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
                <Clock size={16} />
            </div>
            <h3 className="font-bold text-slate-900">Recent activity</h3>
        </div>
        <Link href="/admin/activity" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:gap-2 transition-all">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {activities.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {activities.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={`${item.type}-${item.id}`} 
                className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group cursor-default"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                  item.type === 'user_joined' 
                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  {item.type === 'user_joined' ? <UserPlus size={18} /> : <Printer size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{item.subtitle}</p>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.date.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Clock size={40} className="mb-3 opacity-20" />
            <span className="text-sm">No activity in the system</span>
          </div>
        )}
      </div>
    </div>
  );
}
