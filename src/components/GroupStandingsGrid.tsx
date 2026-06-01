import React from 'react';
import { TEAMS, GROUPS } from '../data/teams';
import { Match } from '../types';
import { calculateGroupStandings } from '../utils/points';

interface GroupStandingsGridProps {
  matches: Match[];
}

export function GroupStandingsGrid({ matches }: GroupStandingsGridProps) {
  return (
    <div className="bg-bg-card border border-slate-800 rounded-sm p-5 shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-900 gap-2">
        <div>
          <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-pulse"></span>
            Fase de Grupos (Standings del Mundial)
          </h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
            Clasificaciones calculadas en tiempo real de los 12 grupos
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 bg-bg-darkest px-2.5 py-1 border border-slate-850">
          <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
          <span>Clasifican a 16avos: Top 2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {GROUPS.map((grp) => {
          const standings = calculateGroupStandings(grp, matches);

          return (
            <div 
              key={grp} 
              className="bg-[#0A0C10] border border-slate-850 hover:border-slate-800 transition rounded-sm overflow-hidden flex flex-col"
            >
              {/* Group Header */}
              <div className="bg-[#0F1218] px-3.5 py-2 border-b border-slate-900 flex justify-between items-center">
                <span className="text-xs font-black font-display text-slate-200">
                  GRUPO {grp}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                  Mundial 2026
                </span>
              </div>

              {/* Group Standings Table */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 text-[8px] text-slate-500 font-mono font-black uppercase pb-1 border-b border-slate-900">
                    <span className="col-span-5">Equipo</span>
                    <span className="col-span-2 text-center">PJ</span>
                    <span className="col-span-3 text-center">DG (GF-GC)</span>
                    <span className="col-span-2 text-right">Pts</span>
                  </div>

                  {standings.map((st, index) => {
                    const team = TEAMS.find((t) => t.id === st.teamId);
                    const isQualifying = index < 2; // Top 2 qualify
                    
                    return (
                      <div
                        key={st.teamId}
                        className="grid grid-cols-12 text-xs py-1.5 border-b border-slate-900/30 items-center font-medium"
                      >
                        <span className="col-span-5 truncate flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono font-bold text-center w-4 h-4 flex items-center justify-center rounded-none shrink-0 ${
                            isQualifying 
                              ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' 
                              : 'bg-slate-950 text-slate-600 border border-slate-900'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-base select-none filter drop-shadow">{team?.flagEmoji}</span>
                          <span className="font-bold text-slate-300 font-mono" title={team?.name}>
                            {team?.code}
                          </span>
                        </span>
                        <span className="col-span-2 text-center font-mono text-slate-500">
                          {st.gamesPlayed}
                        </span>
                        <span className="col-span-3 text-center font-mono text-[10px] text-slate-400">
                          {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}{' '}
                          <span className="text-[8px] text-slate-600">
                            ({st.goalsFor}:{st.goalsAgainst})
                          </span>
                        </span>
                        <span className="col-span-2 text-right font-mono font-bold text-slate-200">
                          {st.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
