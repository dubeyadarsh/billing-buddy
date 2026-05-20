import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity, PlusCircle, UserPlus, Package, CreditCard, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HomeDashboardProps {
  companyId: string;
  companyName: string;
  onNavigate: (tab: any) => void;
}

export function HomeDashboard({ companyId, companyName, onNavigate }: HomeDashboardProps) {
  const [stats, setStats] = useState({ collected: 0, toPay: 0, due: 0, balance: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State to hold the current time filter
  const [timeRange, setTimeRange] = useState('This Month');

  // UPDATED: The useEffect now depends on `timeRange` and passes it to the backend
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      // Passing the timeRange to the backend so it can filter the SQL queries
      const res = await window.electronAPI.getDashboardStats({ 
        companyId: Number(companyId), 
        summaryRange: timeRange, 
        timeRange: timeRange 
      });
      
      if (res.success && res.stats) {
        setStats(res.stats);
        setChartData(res.chartData || []);
      }
      setIsLoading(false);
    };
    fetchStats();
  }, [companyId, timeRange]);

  const maxSale = Math.max(...chartData.map(d => d.sales), 1); 

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      
      {/* Dashboard Header with Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{companyName}</h1>
          <p className="text-slate-500 font-medium text-sm">Welcome back. Here is your business overview.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          
          {/* NEW: Time Range Dropdown */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full md:w-auto appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl px-4 py-2.5 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
              <option value="All Time">All Time</option>
            </select>
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Current Date Badge */}
          <div className="hidden md:flex px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 font-medium bg-white/50 rounded-2xl border border-slate-200 border-dashed">
           <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
           Calculating {timeRange} statistics...
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
            {/* Total Sales */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col group relative overflow-hidden transition-all hover:border-blue-300 hover:shadow-md">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Total Sales</p>
                <Wallet className="w-5 h-5 text-blue-400 transition-colors group-hover:text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 relative z-10">₹{stats.collected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>

            {/* Total Purchases */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col group relative overflow-hidden transition-all hover:border-rose-300 hover:shadow-md">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-50 rounded-full opacity-50 pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">Total Purchases</p>
                <TrendingDown className="w-5 h-5 text-rose-400 transition-colors group-hover:text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 relative z-10">₹{stats.toPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>

            {/* Receivables */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col group relative overflow-hidden transition-all hover:border-amber-300 hover:shadow-md">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-50 rounded-full opacity-50 pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Receivables</p>
                <TrendingUp className="w-5 h-5 text-amber-400 transition-colors group-hover:text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 relative z-10">₹{stats.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>

            {/* Cash/Bank Bal */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col group relative overflow-hidden transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-50 rounded-full opacity-50 pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Cash/Bank Bal</p>
                <Activity className="w-5 h-5 text-emerald-400 transition-colors group-hover:text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 relative z-10">₹{stats.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</h3>
            </div>
          </div>

          {/* Bottom Layout: Chart & Quick Actions */}
          <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            
            {/* Sales Trend Chart */}
            <div className="flex-[2] bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Sales Trend</h3>
                  <p className="text-xs text-slate-500 font-medium">Filtering by: {timeRange}</p>
                </div>
              </div>
              
              <div className="flex-1 min-h-[250px]">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    No sales data available for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                        formatter={(value: any) => value !== undefined ? [`₹${(value as number).toFixed(0)}`, 'Sales'] : ['₹0', 'Sales']}
                      />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        dy={10}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right Column: Quick Actions & Status */}
            <div className="flex-1 flex flex-col gap-6">
              
              {/* Quick Actions Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onNavigate('create-sale')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <PlusCircle className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700">Create Invoice</span>
                  </button>
                  <button onClick={() => onNavigate('parties')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <UserPlus className="w-6 h-6 text-slate-400 mb-2 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    <span className="text-xs font-bold text-slate-700">Add Party</span>
                  </button>
                  <button onClick={() => onNavigate('inventory')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <Package className="w-6 h-6 text-slate-400 mb-2 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    <span className="text-xs font-bold text-slate-700">Add Item</span>
                  </button>
                  <button onClick={() => onNavigate('cash-bank')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <CreditCard className="w-6 h-6 text-slate-400 mb-2 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    <span className="text-xs font-bold text-slate-700">Record Pymt</span>
                  </button>
                </div>
              </div>

              {/* System Status Card */}
              <div className="bg-[#0f172a] rounded-2xl p-6 text-white shadow-lg flex-1 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Status</p>
                  <h3 className="text-lg font-bold">All services operational</h3>
                </div>
                <div className="flex items-center mt-6">
                  <span className="relative flex h-2.5 w-2.5 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-slate-300">Live reconciliation active</span>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}