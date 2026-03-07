import { Calendar, CheckCircle2, Users, TrendingUp, Lock } from 'lucide-react';

export function OrdersLockedView() {
  const benefits = [
    {
      icon: Calendar,
      title: "Deadline Tracking",
      description: "Never miss a delivery date again",
    },
    {
      icon: Users,
      title: "Client Database",
      description: "Manage customer details and history",
    },
    {
      icon: CheckCircle2,
      title: "Status Workflow",
      description: "Track from Quote to Shipped",
    },
    {
      icon: TrendingUp,
      title: "Profit Analytics",
      description: "See exactly how much you earn",
    },
  ];

  return (
    <div className="w-full min-h-[600px] flex flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group transition-all hover:shadow-md hover:border-blue-100">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Unlock Full Orders Management
        </h2>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Take control of your 3D printing business with comprehensive order tracking, status updates, and client management.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-100 shadow-sm hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <benefit.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-slate-500 leading-snug">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-1">
          <span>Upgrade to Pro</span>
        </div>
        
        <p className="mt-4 text-xs text-slate-400 font-medium uppercase tracking-wider">
          30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}
