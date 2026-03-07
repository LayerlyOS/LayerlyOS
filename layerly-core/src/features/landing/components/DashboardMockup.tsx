
'use client';

import { 
  LayoutDashboard, 
  Settings, 
  Printer, 
  Box, 
  CreditCard,
  Users,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';

export function DashboardMockup() {

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans select-none text-slate-600 flex ring-1 ring-slate-900/5">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col py-6 px-4 hidden md:flex">
        {/* Main Menu */}
        <div className="flex flex-col gap-1 mb-8">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</div>
          
          <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold cursor-default">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-default">
            <Printer className="w-5 h-5" />
            <span>Printers</span>
            <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">8</span>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-default">
            <Box className="w-5 h-5" />
            <span>Inventory</span>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-default">
            <Users className="w-5 h-5" />
            <span>Customers</span>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-default">
            <CreditCard className="w-5 h-5" />
            <span>Orders</span>
          </div>
        </div>

        {/* System */}
        <div className="flex flex-col gap-1 mb-auto">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System</div>
          <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-default">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </div>
        </div>

        {/* Pro Plan Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-medium text-slate-300">Pro Plan</div>
            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">PRO</span>
          </div>
          <div className="text-2xl font-bold mb-1">85%</div>
          <div className="text-[10px] text-slate-400 mb-3">Storage used (42.5/50GB)</div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-blue-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
        {/* Header */}
        <div className="h-16 sm:h-20 border-b border-slate-100 bg-white/70 backdrop-blur-sm px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">Dashboard</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Welcome back, here is what&apos;s happening today.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 font-bold text-xs sm:text-sm">
               JD
             </div>
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 sm:p-8 overflow-hidden relative h-full">
          {/* Stats Row */}
          <div className="flex gap-3 sm:gap-6 mb-5 sm:mb-8 overflow-hidden">
             {/* Stat 1 */}
             <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm min-w-[170px] sm:min-w-[200px] flex-1">
               <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 sm:mb-4">
                 <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
               </div>
               <div className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Total Revenue</div>
               <div className="text-xl sm:text-2xl font-bold text-slate-800">$12,450</div>
             </div>
             
             {/* Stat 2 */}
             <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm min-w-[170px] sm:min-w-[200px] flex-1">
               <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3 sm:mb-4">
                 <Box className="w-4 h-4 sm:w-5 sm:h-5" />
               </div>
               <div className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Active Orders</div>
               <div className="text-xl sm:text-2xl font-bold text-slate-800">24</div>
             </div>

             {/* Stat 3 */}
             <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm min-w-[170px] sm:min-w-[200px] flex-1">
               <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-3 sm:mb-4">
                 <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
               </div>
               <div className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Printers Active</div>
               <div className="text-xl sm:text-2xl font-bold text-slate-800">8/12</div>
             </div>
             
             {/* Stat 4 */}
             <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm min-w-[170px] sm:min-w-[200px] flex-1">
               <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 sm:mb-4">
                 <Box className="w-4 h-4 sm:w-5 sm:h-5" />
               </div>
               <div className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Filament Used</div>
               <div className="text-xl sm:text-2xl font-bold text-slate-800">124kg</div>
             </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Recent Orders</h3>
              <span className="text-xs sm:text-sm font-semibold text-blue-600 cursor-default hover:text-blue-700">View All</span>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Box className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700">Order #204{i}</div>
                      <div className="text-xs text-slate-400">2 mins ago • 3 items</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                    Completed
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Print Completed Notification Overlay */}
        <div className="absolute bottom-4 sm:bottom-8 left-4 right-4 sm:left-8 sm:right-auto bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 p-4 sm:p-5 w-[min(92vw,400px)] z-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex-shrink-0 flex items-center justify-center text-green-600 border border-green-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-800 mb-1">Print Completed</h4>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Batch #4023 for SpaceX Proto has finished successfully.
              </p>
              <div className="flex gap-3">
                <button type="button" className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  View Report
                </button>
                <button type="button" className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
            <button type="button" className="text-slate-300 hover:text-slate-500 transition-colors self-start -mt-1 -mr-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
