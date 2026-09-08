import React from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Award, Clock, Zap, Check } from 'lucide-react';

interface BestPicksPanelProps {
  frames: BurstFrame[];
  selectedFrameId: string | null;
  onSelectFrame: (frame: BurstFrame) => void;
}

export const BestPicksPanel: React.FC<BestPicksPanelProps> = ({
  frames,
  selectedFrameId,
  onSelectFrame,
}) => {
  // Sort by score descending and get top 4
  const topPicks = [...frames]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 4);

  if (topPicks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              AI BEST PICKS
            </h2>
            <p className="text-xs text-slate-400">
              ブレがなく鮮明度・露出が高い上位フレーム
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {topPicks.map((frame, idx) => {
          const isSelected = selectedFrameId === frame.id;
          const isFirst = idx === 0;

          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border text-left bg-slate-900 ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10 scale-[1.02]'
                  : 'border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
              }`}
            >
              {/* Badge */}
              <div className="absolute top-2 left-2 z-10">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md shadow-sm ${
                    isFirst
                      ? 'bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-950/80 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isFirst && <Zap className="w-3 h-3 fill-slate-950" />}
                  {isFirst ? 'BEST PICK' : `RANK ${idx + 1}`}
                </span>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Image Preview */}
              <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                <img
                  src={frame.dataUrl}
                  alt={`Best pick ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info footer */}
              <div className="p-2.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{frame.timestamp.toFixed(2)}s</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">SCORE</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {frame.score ?? 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
