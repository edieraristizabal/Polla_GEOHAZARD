import React, { useState } from 'react';
import { Award, CheckCircle, Flame, HelpCircle, ShieldAlert, Trophy, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Participant, Match, Team } from '../types';
import { AVATAR_OPTIONS } from '../data/avatars';
import { TEAMS } from '../data/teams';

interface LeaderboardProps {
  participants: Participant[];
  matches: Match[];
  activeParticipantId: string | null;
}

export function Leaderboard({ participants, matches, activeParticipantId }: LeaderboardProps) {
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);

  // Sort participants by points descending, then exact scores descending, then correct winner descending, then alphabetical
  const sortedParticipants = [...participants].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.stats.correctExactScore !== a.stats.correctExactScore) {
      return b.stats.correctExactScore - a.stats.correctExactScore;
    }
    if (b.stats.correctWinner !== a.stats.correctWinner) {
      return b.stats.correctWinner - a.stats.correctWinner;
    }
    return a.name.localeCompare(b.name);
  });

  const getAvatarInfo = (avatarId: string) => {
    return AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];
  };

  const getTeamInfo = (teamId: string | null): Team | null => {
    if (!teamId) return null;
    return TEAMS.find((t) => t.id === teamId) || null;
  };

  return (
    <div className="bg-bg-card border border-slate-800 rounded-sm p-5 shadow-lg">
      <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
        <h2 className="font-display text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Trophy className="text-brand-primary animate-pulse" size={18} />
          Tabla de Posiciones General
        </h2>
        <span className="text-[10px] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-sm font-mono uppercase font-bold tracking-wider">
          {participants.length} Competidores
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">
              <th className="py-2.5 px-2 text-center w-12">Pos</th>
              <th className="py-2.5 px-4">Participante</th>
              <th className="py-2.5 px-2 text-center">Ganador (+1)</th>
              <th className="py-2.5 px-2 text-center">Exacto (+1)</th>
              <th className="py-2.5 px-2 text-center font-bold">Ronda (+1)</th>
              <th className="py-2.5 px-4 text-right pr-6 font-bold text-brand-primary">Puntos</th>
              <th className="py-2.5 px-2 text-center w-16">Historial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 text-sm">
            {sortedParticipants.map((p, index) => {
              const av = getAvatarInfo(p.avatarUrl);
              const rank = index + 1;
              const isActive = p.id === activeParticipantId;

              // Rank Badge Styling (Geometric Balance)
              let rankStyle = "bg-slate-900 text-slate-400 border border-slate-800";
              if (rank === 1) rankStyle = "bg-brand-primary/20 text-brand-primary border border-brand-primary/30 font-black";
              if (rank === 2) rankStyle = "bg-slate-800/30 text-slate-200 border border-slate-700/80 font-bold";
              if (rank === 3) rankStyle = "bg-amber-900/20 text-amber-500 border border-amber-850 font-bold";

              return (
                <React.Fragment key={p.id}>
                  <tr
                    className={`hover:bg-slate-800/20 transition-all ${
                      isActive ? 'bg-brand-primary/5 border-l-2 border-brand-primary' : ''
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-none text-xs font-mono font-bold ${rankStyle}`}>
                        {rank.toString().padStart(2, '0')}
                      </span>
                    </td>

                    {/* Participant Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-sm shrink-0 flex items-center justify-center text-lg shadow-sm border border-slate-800/60 ${av.bgColor}`}>
                          {av.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-200 block truncate max-w-[120px] sm:max-w-none">
                              {p.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] bg-brand-primary text-black font-black px-1 py-0.5 rounded-sm font-mono uppercase tracking-wider">
                                TÚ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[150px] sm:max-w-none leading-none mt-1">
                            {p.email}
                          </span>
                          
                          {/* Compliance state information */}
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
                            {p.isCompleted ? (
                              <span className="inline-flex items-center text-[9px] text-brand-cyan gap-0.5 font-mono lowercase">
                                <CheckCircle size={9} /> listo
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[9px] text-amber-500 gap-0.5 font-mono lowercase">
                                <HelpCircle size={9} /> incompleto
                              </span>
                            )}
                            {p.hasAutoFilled && (
                              <span className="inline-flex items-center text-[8px] bg-red-950/20 text-rose-400 px-1 border border-rose-900/20 rounded-sm font-mono uppercase font-bold tracking-tight">
                                <ShieldAlert size={8} className="mr-0.5" /> Auto-Completado Tarde
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Correct Winner Outcome */}
                    <td className="py-3 px-2 text-center font-mono text-xs text-slate-400">
                      {p.stats.correctWinner}
                    </td>

                    {/* Correct Exact Score */}
                    <td className="py-3 px-2 text-center font-mono text-xs text-slate-400">
                      <span className={p.stats.correctExactScore > 0 ? 'text-brand-cyan font-bold bg-brand-cyan/10 px-1.5 py-0.5 border border-brand-cyan/10 rounded-sm' : ''}>
                        {p.stats.correctExactScore}
                      </span>
                    </td>

                    {/* Correct Qualified / Advance Points */}
                    <td className="py-3 px-2 text-center font-mono text-xs text-slate-400">
                      {p.stats.correctQualifiedTeams}
                    </td>

                    {/* Total Score */}
                    <td className="py-3 px-4 text-right pr-6">
                      <span className="text-sm font-black text-brand-primary font-mono bg-brand-primary/5 border border-brand-primary/10 px-2.5 py-1 rounded-sm shadow-inner">
                        {p.points} <span className="text-[9px] text-slate-500 font-normal">PTS</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      <button
                        title="Ver Cartilla de Pronósticos"
                        onClick={() => setExpandedParticipantId(expandedParticipantId === p.id ? null : p.id)}
                        className="p-1 px-2.5 rounded-sm hover:bg-brand-primary hover:text-black bg-slate-900 border border-slate-800 text-slate-400 transition-all duration-150 flex items-center gap-1.5 text-[10px] mx-auto font-mono uppercase font-bold"
                      >
                        <Eye size={12} />
                        {expandedParticipantId === p.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Predictions Bracket Visualizer */}
                  {expandedParticipantId === p.id && (
                    <tr>
                      <td colSpan={7} className="py-3 px-4 bg-slate-950 border-t border-b border-slate-800">
                        <div className="py-1">
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8] font-mono mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-primary inline-block rounded-none"></span>
                            Resultados Guardados por {p.name}
                          </h4>

                          {/* Quick visual mapping of matches */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                            {matches.map((m) => {
                              const homeTeam = getTeamInfo(m.homeTeamId);
                              const awayTeam = getTeamInfo(m.awayTeamId);
                              const pred = p.predictions[m.id];
                              
                              // Check if match actually played out
                              const played = m.homeScore !== null && m.awayScore !== null;
                              let borderStyle = 'border-slate-800/60 bg-[#0F1218]/40';
                              let badge = null;

                              if (played && pred) {
                                const actH = m.homeScore!;
                                const actA = m.awayScore!;
                                const prH = pred.homeScore;
                                const prA = pred.awayScore;

                                if (prH !== null && prA !== null) {
                                  const exact = actH === prH && actA === prA;
                                  const actWinner = actH > actA ? 'H' : actH < actA ? 'A' : 'D';
                                  const predWinner = prH > prA ? 'H' : prH < prA ? 'A' : 'D';

                                  if (actWinner === predWinner) {
                                    if (exact) {
                                      borderStyle = 'border-brand-primary/40 bg-brand-primary/5';
                                      badge = <span className="text-[8px] bg-brand-primary text-black font-black px-1 rounded-sm font-mono tracking-tight">EXACTO (+2)</span>;
                                    } else {
                                      borderStyle = 'border-brand-cyan/40 bg-brand-cyan/5';
                                      badge = <span className="text-[8px] bg-brand-cyan text-black font-black px-1 rounded-sm font-mono tracking-tight">GANADOR (+1)</span>;
                                    }
                                  } else {
                                    borderStyle = 'border-rose-950/80 bg-rose-950/10';
                                    badge = <span className="text-[8px] bg-rose-950 text-rose-400 font-bold px-1 border border-rose-900/20 rounded-sm font-mono tracking-tight">X 0 PTS</span>;
                                  }
                                }
                              }

                              return (
                                <div key={m.id} className={`p-2 rounded-none border text-xs ${borderStyle} flex flex-col justify-between h-full min-h-[72px]`}>
                                  <div className="text-[9px] text-slate-500 font-mono flex justify-between items-center mb-1">
                                    <span className="truncate max-w-[100px] uppercase font-bold">{m.description}</span>
                                    {badge}
                                  </div>

                                  <div className="flex items-center justify-between font-normal">
                                    {/* Teams and predictions */}
                                    <span className="truncate text-slate-300">
                                      {homeTeam?.flagEmoji} <span className="font-bold font-mono text-xs">{homeTeam?.code || m.placeholderHome || 'TBD'}</span>
                                    </span>
                                    <span className="bg-slate-900/80 border border-slate-800/80 px-1.5 py-0.5 rounded-none font-mono font-bold text-white text-xs">
                                      {pred?.homeScore !== null ? pred.homeScore : '-'} : {pred?.awayScore !== null ? pred.awayScore : '-'}
                                    </span>
                                    <span className="truncate text-right text-slate-300">
                                      <span className="font-bold font-mono text-xs mr-1">{awayTeam?.code || m.placeholderAway || 'TBD'}</span>
                                      {awayTeam?.flagEmoji}
                                    </span>
                                  </div>

                                  {played && (
                                    <div className="mt-1 pb-0.5 border-t border-slate-900 text-[9px] text-slate-500 font-mono text-center">
                                      Real: {m.homeScore} - {m.awayScore}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
