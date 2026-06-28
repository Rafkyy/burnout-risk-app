import React, { useState } from 'react';
import { ChevronRight, Calendar, AlertCircle, Info, ChevronLeft, Award, Trash2 } from 'lucide-react';
import { AssessmentResult } from '../types';

interface HistoryScreenProps {
  history: AssessmentResult[];
  onSelectHistoryItem: (item: AssessmentResult) => void;
  onBack?: () => void;
  onDeleteItem?: (assessmentId: string) => void;
}

export default function HistoryScreen({ history, onSelectHistoryItem, onBack, onDeleteItem }: HistoryScreenProps) {
  const [activeHoverNode, setActiveHoverNode] = useState<number | null>(null);

  // Parse chronological data for trend line
  // We have months: Jan, Feb, Mar, Apr, Mei, Jun
  const monthsMapping = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Let's gather the latest assessments sorted chronologically to plot the line chart nicely
  const getSortedTrendData = () => {
    // Return a list of up to 6 historical data points with month names
    // To present a clean plot, mapping them to standard months or simulated months
    return history.slice().reverse().map((item, idx) => {
      // Parse month or assign simulated month based on index to ensure we have continuous plot
      const dateParts = item.date.split(' ');
      const monthLabel = dateParts[1] || 'Mei';
      return {
        label: monthLabel,
        score: Math.round(item.score * 100),
        raw: item,
      };
    });
  };

  const trendData = getSortedTrendData();

  // SVG Chart Dimensions
  const chartHeight = 120;
  const chartWidth = 320;
  const paddingX = 40;
  const paddingY = 20;

  // Calculate coordinates for SVG path
  const points = trendData.map((d, index) => {
    const xStep = (chartWidth - paddingX * 2) / Math.max(1, trendData.length - 1);
    const x = paddingX + index * xStep;
    // score 0 is at bottom (height - paddingY), score 100 is at top (paddingY)
    const yRange = chartHeight - paddingY * 2;
    const y = chartHeight - paddingY - (d.score / 100) * yRange;
    return { x, y, ...d };
  });

  // Construct path string for area and line
  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // We can use cubic bezier curves for smooth lines as shown in mockup
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (2 * (points[i].x - points[i - 1].x)) / 3;
      const cpY2 = points[i].y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }

    // Connect boundaries for area fill
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  const getRiskBadgeStyles = (level: string) => {
    switch (level) {
      case 'Tinggi':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/25';
      case 'Sedang':
        return 'bg-elegant-gold/10 text-elegant-gold border-elegant-gold/25';
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
    }
  };

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      {/* Header bar matching mockup */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center shrink-0 sticky top-0 z-10 justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition mr-2 flex items-center text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            <span>Kembali</span>
          </button>
        ) : (
          <div className="w-6"></div>
        )}
        <h2 className="text-white font-serif-elegant font-bold text-center flex-1 text-base tracking-wide">
          Riwayat Asesmen
        </h2>
        <div className="w-6"></div>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Trend Area Chart Container Card */}
        <div className="bg-elegant-panel rounded-2xl p-4 border border-white/5 shadow-md space-y-3">
          <div className="flex justify-between items-baseline">
            <h3 className="font-bold text-white text-xs font-serif-elegant uppercase tracking-wider" id="history-trend-title">
              Tren Indeks Overload
            </h3>
            <span className="text-[9px] bg-white/5 border border-white/5 text-slate-400 font-bold px-2 py-0.5 rounded-full">
              Skala 0-100
            </span>
          </div>

          {/* SVG line chart plot */}
          <div className="relative w-full overflow-x-auto bg-elegant-card rounded-xl p-2.5 border border-white/5">
            {points.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                Data tidak cukup untuk melihat tren harian.
              </div>
            ) : (
              <div className="min-w-[300px] flex flex-col items-center">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#C9A050" stopOpacity="0.32" />
                       <stop offset="100%" stopColor="#C9A050" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
 
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map((gridVal) => {
                    const y = chartHeight - paddingY - (gridVal / 100) * (chartHeight - paddingY * 2);
                    return (
                      <g key={gridVal} className="opacity-40">
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 3}
                          textAnchor="end"
                          className="font-mono text-[9px] fill-slate-500 font-medium"
                        >
                          {gridVal}
                        </text>
                      </g>
                    );
                  })}
 
                  {/* Gradient Area under curve */}
                  <path d={areaPath} fill="url(#chartGradient)" />
 
                  {/* Main Line path */}
                  <path d={linePath} fill="none" stroke="#C9A050" strokeWidth="2.5" strokeLinecap="round" />
 
                  {/* Nodes with mouse hover highlights */}
                  {points.map((pt, idx) => (
                    <g
                      key={idx}
                      onMouseEnter={() => setActiveHoverNode(idx)}
                      onMouseLeave={() => setActiveHoverNode(null)}
                      onClick={() => onSelectHistoryItem(pt.raw)}
                      className="cursor-pointer"
                    >
                      {/* Interactive halo boundary indicator on active */}
                      {activeHoverNode === idx && (
                        <circle cx={pt.x} cy={pt.y} r="8" fill="#C9A050" fillOpacity="0.25" />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#0A0B0D"
                        stroke="#C9A050"
                        strokeWidth="2"
                      />
                      {/* Month names ticks on bottom X axis */}
                      <text
                        x={pt.x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        className="font-sans text-[9px] fill-slate-400 font-bold uppercase tracking-wider"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>
 
                {/* Hover node tooltip label overlay */}
                {activeHoverNode !== null && points[activeHoverNode] && (
                  <div className="text-center bg-slate-900 border border-white/5 text-white text-[10px] px-2.5 py-1 rounded-md shadow-md mt-1 font-bold">
                    Bulan: {points[activeHoverNode].label} | Skor Burn Rate:{' '}
                    {(points[activeHoverNode].score / 100).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
 
        {/* Previous Assessments Cards List */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase px-1">
            Hasil Asesmen Sebelumnya
          </h4>
 
          <div className="space-y-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem(item)}
                className="bg-elegant-panel/70 border border-white/5 hover:border-elegant-gold/20 hover:bg-elegant-panel p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer transition duration-150 relative overflow-hidden group"
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {item.date}
                    </span>
                  </div>
 
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full border font-extrabold uppercase tracking-wider ${getRiskBadgeStyles(
                        item.riskLevel
                      )}`}
                    >
                      RISIKO {item.riskLevel}
                    </span>
                  </div>
                </div>
 
                {/* Ratio representation right formatted label: 82/100 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-extrabold text-lg">
                    {Math.round(item.score * 100)}<span className="text-xs text-slate-500 font-medium">/100</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
