import React, { useState } from 'react';
import { Shield, Sliders, Trash2, Key, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';
import { Match, Team } from '../types';
import { TEAMS } from '../data/teams';
import { Participant } from '../types';

interface MatchAdminProps {
  matches: Match[];
  participants: Participant[];
  githubPat: string;
  onUpdateGithubPat: (token: string) => void;
  onApproveParticipantDirectly: (email: string) => void;
  onRejectParticipantDirectly: (email: string) => void;
  onUpdateMatchScore: (matchId: string, homeScore: number, awayScore: number, winnerIdToAdvance?: string | null) => void;
}

export function MatchAdmin({
  matches,
  participants,
  githubPat,
  onUpdateGithubPat,
  onApproveParticipantDirectly,
  onRejectParticipantDirectly,
  onUpdateMatchScore
}: MatchAdminProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [homeScoreInput, setHomeScoreInput] = useState<string>('');
  const [awayScoreInput, setAwayScoreInput] = useState<string>('');
  const [winnerAdv, setWinnerAdv] = useState<string>('');
  const [patInput, setPatInput] = useState<string>(githubPat);

  const getTeamInfo = (teamId: string | null): Team | null => {
    if (!teamId) return null;
    return TEAMS.find((t) => t.id === teamId) || null;
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const homeTeam = selectedMatch ? getTeamInfo(selectedMatch.homeTeamId) : null;
  const awayTeam = selectedMatch ? getTeamInfo(selectedMatch.awayTeamId) : null;

  const handleMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || homeScoreInput === '' || awayScoreInput === '') return;

    const hs = parseInt(homeScoreInput, 10);
    const as = parseInt(awayScoreInput, 10);

    let winnerId = winnerAdv || null;
    if (selectedMatch && selectedMatch.stage !== 'groups' && hs !== as) {
      winnerId = hs > as ? selectedMatch.homeTeamId : selectedMatch.awayTeamId;
    }

    onUpdateMatchScore(selectedMatchId, hs, as, winnerId);

    // Clear
    setSelectedMatchId('');
    setHomeScoreInput('');
    setAwayScoreInput('');
    setWinnerAdv('');
  };

  const handlePatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGithubPat(patInput.trim());
    alert('Token de GitHub actualizado correctamente en el navegador.');
  };

  // Filter participants
  const pendingUsers = participants.filter((p) => p.status === 'pending');
  const activeUsers = participants.filter((p) => p.status !== 'pending');

  return (
    <div className="bg-bg-card border border-brand-amber/30 rounded-sm p-5 shadow-lg relative overflow-hidden space-y-6">
      {/* Warning top striped line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-repeating-linear bg-[linear-gradient(45deg,#f59e0b_25%,#000_25%,#000_50%,#f59e0b_50%,#f59e0b_75%,#000_75%,#000)] bg-[length:12px_12px]" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-brand-amber animate-pulse" />
          <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
            Panel de Administrador (Edier)
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black font-mono uppercase bg-brand-amber/10 text-brand-amber border border-brand-amber/20">
          Modo Autónomo
        </span>
      </div>

      {/* GitHub Token Config */}
      <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850">
        <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center justify-between pb-2 border-b border-slate-955">
          <span className="flex items-center gap-1.5"><Key size={11} /> GitHub Token (PAT)</span>
          {githubPat ? (
            <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle size={10} /> Configurado
            </span>
          ) : (
            <span className="text-[9px] text-rose-400 flex items-center gap-1 font-bold">
              <XCircle size={10} /> No Configurado
            </span>
          )}
        </h4>
        <form onSubmit={handlePatSubmit} className="space-y-3">
          <p className="text-[10px] text-slate-500 leading-normal font-sans">
            Para poder aprobar e inscribir participantes permanentemente, introduce tu GitHub Personal Access Token. Se almacena localmente en tu navegador.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="ghp_..."
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              className="flex-1 bg-black border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-amber font-mono"
            />
            <button
              type="submit"
              className="bg-brand-amber hover:bg-amber-600 text-black text-[10px] font-black uppercase font-mono px-4 rounded-sm transition cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Registration workflow list */}
      <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850">
        <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center justify-between pb-2 border-b border-slate-955">
          <span>👥 Control de Participantes ({participants.length})</span>
        </h4>

        {/* 1. Solicitudes Pendientes */}
        <div className="space-y-2 mb-4">
          <h5 className="text-[10px] font-mono uppercase text-slate-400 font-black">
            Solicitudes Pendientes ({pendingUsers.length})
          </h5>
          {pendingUsers.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic font-sans font-normal">No hay solicitudes pendientes de aprobación.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pendingUsers.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-black/60 p-2.5 border border-slate-900 rounded-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={`/data/avatars/${p.avatarUrl}`}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-brand-amber/30 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => onApproveParticipantDirectly(p.email)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/30 text-emerald-400 hover:text-white rounded-sm font-mono text-[9px] font-black uppercase transition cursor-pointer"
                    >
                      <UserCheck size={10} /> Aprobar
                    </button>
                    <button
                      onClick={() => onRejectParticipantDirectly(p.email)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/30 text-rose-400 hover:text-white rounded-sm font-mono text-[9px] font-black uppercase transition cursor-pointer"
                    >
                      <UserX size={10} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Participantes Activos */}
        <div className="space-y-2 pt-2 border-t border-slate-900">
          <h5 className="text-[10px] font-mono uppercase text-slate-400 font-black">
            Participantes Aprobados ({activeUsers.length})
          </h5>
          {activeUsers.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic font-sans font-normal">No hay participantes aprobados aún.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeUsers.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-black/30 p-2 border border-slate-900 rounded-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={`/data/avatars/${p.avatarUrl}`}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full border border-slate-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-300 truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-500 truncate font-mono">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-brand-primary">{p.points} pts</span>
                    <button
                      onClick={() => onRejectParticipantDirectly(p.email)}
                      className="p-1 bg-red-950/20 hover:bg-red-900/30 text-rose-400 hover:text-white rounded-sm border border-red-900/10 transition cursor-pointer"
                      title="Eliminar participante"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Record match score manually if needed */}
        <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850">
          <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-955">
            <Sliders size={11} />
            Ingresar Marcador Real
          </h4>

          <form onSubmit={handleMatchSubmit} className="space-y-3">
            <div>
              <label htmlFor="admin-match-select" className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1 font-mono">Partido</label>
              <select
                id="admin-match-select"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-amber cursor-pointer"
              >
                <option value="">-- Elige un partido --</option>
                {matches.map((m) => {
                  const ht = getTeamInfo(m.homeTeamId);
                  const at = getTeamInfo(m.awayTeamId);
                  const isFinished = m.homeScore !== null && m.awayScore !== null;
                  return (
                    <option key={m.id} value={m.id} className="bg-black text-slate-300">
                      [{m.stage.toUpperCase()}] {ht?.code || m.placeholderHome || 'TBD'} vs {at?.code || m.placeholderAway || 'TBD'}{' '}
                      {isFinished ? `(${m.homeScore}-${m.awayScore})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedMatch && (
              <div className="space-y-3 py-2.5 px-3 bg-black border border-slate-850 rounded-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase font-mono tracking-tight text-slate-300">
                  <span className="truncate max-w-[35%]">{homeTeam?.code || selectedMatch.placeholderHome || 'Local'}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label="Goles real del equipo local"
                      type="number"
                      min="0"
                      value={homeScoreInput}
                      onChange={(e) => setHomeScoreInput(e.target.value)}
                      className="w-9 h-8 text-center rounded-none border border-slate-700 bg-slate-950 font-mono text-sm font-bold text-white focus:border-brand-amber outline-none"
                    />
                    <span className="text-slate-600 font-bold font-mono">-</span>
                    <input
                      aria-label="Goles real del equipo visitante"
                      type="number"
                      min="0"
                      value={awayScoreInput}
                      onChange={(e) => setAwayScoreInput(e.target.value)}
                      className="w-9 h-8 text-center rounded-none border border-slate-700 bg-slate-950 font-mono text-sm font-bold text-white focus:border-brand-amber outline-none"
                    />
                  </div>
                  <span className="truncate max-w-[35%] text-right">{awayTeam?.code || selectedMatch.placeholderAway || 'Visitante'}</span>
                </div>

                {/* For draws in playoffs */}
                {selectedMatch.stage !== 'groups' && homeScoreInput !== '' && awayScoreInput !== '' && homeScoreInput === awayScoreInput && (
                  <div className="pt-2 border-t border-slate-900 text-[9px] text-center text-slate-400">
                    <p className="mb-1.5 font-bold uppercase text-brand-amber font-mono tracking-wide">Ganador penales (Clasifica):</p>
                    <div className="flex justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWinnerAdv(selectedMatch.homeTeamId || '')}
                        className={`px-3 py-1 rounded-sm text-[10px] transition font-bold font-mono uppercase ${
                          winnerAdv === selectedMatch.homeTeamId ? 'bg-brand-amber text-black font-black' : 'bg-slate-950 hover:bg-slate-900 text-slate-400'
                        }`}
                      >
                        {homeTeam?.code || selectedMatch.placeholderHome || 'Local'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWinnerAdv(selectedMatch.awayTeamId || '')}
                        className={`px-3 py-1 rounded-sm text-[10px] transition font-bold font-mono uppercase ${
                          winnerAdv === selectedMatch.awayTeamId ? 'bg-brand-amber text-black font-black' : 'bg-slate-950 hover:bg-slate-900 text-slate-400'
                        }`}
                      >
                        {awayTeam?.code || selectedMatch.placeholderAway || 'Visitante'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-primary text-black hover:bg-emerald-600 font-mono text-[10px] font-black uppercase tracking-widest rounded-sm transition duration-150 cursor-pointer"
                >
                  Confirmar Marcador
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Database backup section */}
        <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center justify-between pb-2 border-b border-slate-955">
              <span>📋 Copiar Base de Datos de Participantes</span>
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-normal">
              Copia el JSON consolidado de participantes y sus pronósticos actuales. Esto sirve como respaldo o para actualizar directamente el archivo estático local `src/data/participants.json` de tu código.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(participants, null, 2))
                .then(() => alert("📋 Base de datos JSON copiada al portapapeles con éxito."))
                .catch(() => alert("Error al copiar al portapapeles."));
            }}
            className="w-full mt-4 py-2 bg-brand-amber/20 hover:bg-brand-amber/30 border border-brand-amber/30 text-brand-amber hover:text-white font-mono text-[9px] font-black uppercase tracking-wider rounded-sm transition text-center cursor-pointer font-bold"
          >
            📋 Copiar JSON de Participantes
          </button>
        </div>
      </div>
    </div>
  );
}
