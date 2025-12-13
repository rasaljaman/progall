import React, { useState, useEffect, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';
import { BarChart3, Search, Copy, Download, Eye, Smartphone, Monitor } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState(30); // Days

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await supabaseService.getAnalyticsData(timeFilter);
      setEvents(data);
      setLoading(false);
    };
    loadData();
  }, [timeFilter]);

  const stats = useMemo(() => {
    const totalViews = events.filter(e => e.event_type === 'VIEW').length;
    const totalCopies = events.filter(e => e.event_type === 'COPY').length;
    const totalDownloads = events.filter(e => e.event_type === 'DOWNLOAD').length;
    const totalSearches = events.filter(e => e.event_type === 'SEARCH').length;
    
    // Device Breakdown
    const mobile = events.filter(e => e.details?.device === 'Mobile').length;
    const desktop = events.filter(e => e.details?.device === 'Desktop').length;

    // Top Search Terms
    const searchMap: Record<string, number> = {};
    events.filter(e => e.event_type === 'SEARCH').forEach(e => {
      const term = e.details?.term?.toLowerCase();
      if(term) searchMap[term] = (searchMap[term] || 0) + 1;
    });
    const topSearches = Object.entries(searchMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return { totalViews, totalCopies, totalDownloads, totalSearches, mobile, desktop, topSearches };
  }, [events]);

  if (loading) return <div className="min-h-screen bg-[#123926] flex items-center justify-center text-[#b88b2e]">Loading Intelligence...</div>;

  return (
    <div className="min-h-screen bg-[#123926] text-[#f2e8cf] p-6 pb-20 pt-24 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8 border-b border-[#7a4f36]/30 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#b88b2e]">Website Intelligence</h1>
            <p className="text-[#a7c957] text-sm mt-1">User behavior analysis for the last {timeFilter} days</p>
          </div>
          <div className="flex gap-2 bg-[#0e0e10]/50 p-1 rounded-lg">
             {[7, 30, 90].map(d => (
               <button key={d} onClick={() => setTimeFilter(d)} className={`px-4 py-1 rounded text-xs font-bold transition-all ${timeFilter === d ? 'bg-[#b88b2e] text-[#123926]' : 'text-[#f2e8cf]/50 hover:text-[#f2e8cf]'}`}>{d} Days</button>
             ))}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Eye size={20}/>} label="Total Views" value={stats.totalViews} color="text-blue-400" />
          <StatCard icon={<Copy size={20}/>} label="Prompts Copied" value={stats.totalCopies} color="text-[#a7c957]" />
          <StatCard icon={<Download size={20}/>} label="Downloads" value={stats.totalDownloads} color="text-[#bc4749]" />
          <StatCard icon={<Search size={20}/>} label="Searches" value={stats.totalSearches} color="text-[#b88b2e]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* DEVICE BREAKDOWN */}
          <div className="bg-[#0e0e10]/40 border border-[#7a4f36]/30 rounded-xl p-6">
            <h3 className="text-[#b88b2e] font-bold mb-4 flex items-center gap-2"><Smartphone size={18}/> Visitor Devices</h3>
            <div className="flex items-center gap-4 h-32">
               <div className="flex-1 bg-[#123926] rounded-lg relative overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center z-10 font-bold text-xl">{((stats.mobile / events.length) * 100).toFixed(0)}%</div>
                  <div className="absolute bottom-0 left-0 w-full bg-[#a7c957]" style={{ height: `${(stats.mobile / events.length) * 100}%` }}></div>
                  <span className="absolute top-2 left-2 text-xs opacity-50">Mobile</span>
               </div>
               <div className="flex-1 bg-[#123926] rounded-lg relative overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center z-10 font-bold text-xl">{((stats.desktop / events.length) * 100).toFixed(0)}%</div>
                  <div className="absolute bottom-0 left-0 w-full bg-[#bc4749]" style={{ height: `${(stats.desktop / events.length) * 100}%` }}></div>
                  <span className="absolute top-2 left-2 text-xs opacity-50">Desktop</span>
               </div>
            </div>
          </div>

          {/* TOP SEARCH TERMS */}
          <div className="bg-[#0e0e10]/40 border border-[#7a4f36]/30 rounded-xl p-6">
            <h3 className="text-[#b88b2e] font-bold mb-4 flex items-center gap-2"><Search size={18}/> What Users Want</h3>
            <div className="space-y-3">
              {stats.topSearches.map(([term, count], i) => (
                <div key={i} className="flex justify-between items-center bg-[#123926]/50 p-3 rounded-lg border border-[#ffffff]/5">
                  <span className="text-[#f2e8cf] font-medium capitalize">"{term}"</span>
                  <span className="bg-[#b88b2e]/20 text-[#b88b2e] text-xs px-2 py-1 rounded">{count} searches</span>
                </div>
              ))}
              {stats.topSearches.length === 0 && <div className="text-gray-500 text-sm">No search data yet.</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-[#0e0e10]/40 border border-[#7a4f36]/30 p-5 rounded-xl flex flex-col gap-1 hover:border-[#b88b2e]/50 transition-colors">
    <div className={`${color} mb-2`}>{icon}</div>
    <span className="text-2xl font-bold text-[#f2e8cf]">{value}</span>
    <span className="text-xs text-[#f2e8cf]/50 uppercase tracking-wider">{label}</span>
  </div>
);

export default AnalyticsPage;
