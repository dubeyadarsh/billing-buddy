import { useState, useEffect } from 'react';
import { Activity, Trash2, FileText, Package, Users, Building2, Landmark, Clock } from 'lucide-react';

export function ActivityLogs({ companyId }: { companyId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      // Fetch up to 100 recent logs for the full page view
      const res = await window.electronAPI.getActivityLogs(Number(companyId), 100);
      if (res.success && res.data) {
        setLogs(res.data);
      }
      setIsLoading(false);
    };
    fetchLogs();
  }, [companyId]);

  // Helper to format date cleanly (e.g., "2 hours ago", "Oct 24, 2023, 4:30 PM")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString + 'Z'); 
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Dynamically assign colors and icons based on the event type
  const getLogConfig = (action: string, module: string) => {
    let colorClass = "bg-slate-100 text-slate-500 border-slate-200";
    let ActionIcon = Activity;

    // Color logic
    if (action === 'CREATED') colorClass = "bg-blue-50 text-blue-600 border-blue-200";
    if (action === 'DELETED') colorClass = "bg-red-50 text-red-600 border-red-200";
    if (action === 'UPDATED') colorClass = "bg-emerald-50 text-emerald-600 border-emerald-200";

    // Icon logic
    if (module === 'INVOICE' || module === 'PURCHASE') ActionIcon = FileText;
    else if (module === 'INVENTORY') ActionIcon = Package;
    else if (module === 'PARTY') ActionIcon = Users;
    else if (module === 'BANK') ActionIcon = Landmark;
    else if (module === 'COMPANY') ActionIcon = Building2;
    
    // Deletions always get a trash icon regardless of module
    if (action === 'DELETED') ActionIcon = Trash2;

    return { colorClass, ActionIcon };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-full flex flex-col relative overflow-hidden animate-fade-in-up duration-300">
      
      {/* HEADER */}
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center z-10 bg-white sticky top-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center tracking-tight">
            <Activity className="w-6 h-6 mr-3 text-blue-600" /> Audit Trail & Logs
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track all system events and user actions across your workspace.</p>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
        <div className="max-w-4xl mx-auto">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Loading activity trail...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Activity Yet</h3>
              <p className="text-slate-500 text-sm font-medium">Actions taken in your workspace will appear here.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-10">
              {logs.map((log) => {
                const { colorClass, ActionIcon } = getLogConfig(log.action_type, log.module);
                
                return (
                  <div key={log.id} className="relative pl-8 group">
                    {/* Timeline Node Icon */}
                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>

                    {/* Content Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-default">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-slate-900">
                            {log.user_name || 'System User'}
                          </span>
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${colorClass.replace('border-', 'border border-').replace('bg-', 'bg-opacity-30 bg-')}`}>
                            {log.module}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400 flex items-center bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {formatTime(log.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}