import React, { useState } from 'react';
import { Shield, Clock, Calendar, RefreshCw, Star, Trash2, Sliders, PlayCircle } from 'lucide-react';
import { Match, Team, TournamentConfig } from '../types';
import { TEAMS } from '../data/teams';

import { Participant } from '../types';

interface MatchAdminProps {
  config: TournamentConfig;
  matches: Match[];
  participants: Participant[];
  onUpdateConfig: (updated: Partial<TournamentConfig>) => void;
  onUpdateMatchScore: (matchId: string, homeScore: number, awayScore: number, winnerIdToAdvance?: string | null) => void;
  onSimulateGroups: () => void;
  onSimulateFullTournament: () => void;
  onResetTournament: () => void;
  onImportParticipant: (jsonStr: string) => boolean;
  onClearAllParticipants: () => void;
}

export function MatchAdmin({
  config,
  matches,
  participants,
  onUpdateConfig,
  onUpdateMatchScore,
  onSimulateGroups,
  onSimulateFullTournament,
  onResetTournament,
  onImportParticipant,
  onClearAllParticipants
}: MatchAdminProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [homeScoreInput, setHomeScoreInput] = useState<string>('');
  const [awayScoreInput, setAwayScoreInput] = useState<string>('');
  const [winnerAdv, setWinnerAdv] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');

  const [simDate, setSimDate] = useState<string>('2026-06-11');
  const [simHour, setSimHour] = useState<string>('12:00');

  const getTeamInfo = (teamId: string | null): Team | null => {
    if (!teamId) return null;
    return TEAMS.find((t) => t.id === teamId) || null;
  };

  const handleTimeChange = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDate = `${simDate}T${simHour}:00Z`;
    onUpdateConfig({
      currentSimulatedTime: cleanDate,
      isWorldCupStarted: new Date(cleanDate).getTime() >= new Date(config.startedAt).getTime()
    });
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

  const formatTimeText = (isoString: string) => {
    return new Date(isoString).toISOString().split('T')[0];
  };

  return (
    <div className="bg-bg-card border border-brand-amber/30 rounded-sm p-5 shadow-lg relative overflow-hidden">
      {/* Warning top striped line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-repeating-linear bg-[linear-gradient(45deg,#f59e0b_25%,#000_25%,#000_50%,#f59e0b_50%,#f59e0b_75%,#000_75%,#000)] bg-[length:12px_12px]" />

      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-brand-amber" />
        <h3 className="font-display text-sm font-black text-white uppercase tracking-wider">
          Panel de Control & Simulador Mundial
        </h3>
      </div>

      <p className="text-xs text-slate-500 mb-5 leading-relaxed font-sans">
        Este panel te permite actuar como la FIFA: avanza en el tiempo oficial para ver cómo se bloquean los pronósticos de los competidores, e ingresa resultados reales para calcular las tablas de posiciones generales y de grupo.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 1. Time advancement */}
        <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850">
          <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-950">
            <Clock size={11} />
            Línea del Tiempo (Simulador)
          </h4>

          <form onSubmit={handleTimeChange} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="sim-date" className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Fecha</label>
                <input
                  id="sim-date"
                  type="date"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                  className="w-full bg-black border border-slate-800 rounded-sm px-2 py-1 text-xs text-slate-200 outline-none focus:border-brand-amber font-mono"
                />
              </div>
              <div>
                <label htmlFor="sim-hour" className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Hora (UTC)</label>
                <input
                  id="sim-hour"
                  type="time"
                  value={simHour}
                  onChange={(e) => setSimHour(e.target.value)}
                  className="w-full bg-black border border-slate-800 rounded-sm px-2 py-1 text-xs text-slate-200 outline-none focus:border-brand-amber font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full text-[10px] font-mono uppercase tracking-widest py-2 px-3 bg-brand-amber hover:bg-amber-600 text-black font-black rounded-sm transition duration-150 cursor-pointer shadow"
            >
              Aplicar Nueva Fecha
            </button>
          </form>

          {/* Quick Dates shortcuts */}
          <div className="mt-4 flex flex-col gap-1.5 pt-3.5 border-t border-slate-955">
            <button
              onClick={() => {
                setSimDate('2026-06-11');
                setSimHour('17:50');
                onUpdateConfig({
                  currentSimulatedTime: '2026-06-11T17:50:00Z',
                  isWorldCupStarted: false
                });
              }}
              className="text-[9px] text-left px-2.5 py-1.5 bg-black hover:bg-slate-900 border border-slate-850 rounded-sm font-mono text-slate-400 font-bold uppercase tracking-wide hover:text-white transition-colors cursor-pointer"
            >
              📅 10 mins antes del inaugural
            </button>
            <button
              onClick={() => {
                setSimDate('2026-06-15');
                setSimHour('12:00');
                onUpdateConfig({
                  currentSimulatedTime: '2026-06-15T12:00:00Z',
                  isWorldCupStarted: true
                });
              }}
              className="text-[9px] text-left px-2.5 py-1.5 bg-black hover:bg-slate-900 border border-slate-850 rounded-sm font-mono text-slate-400 font-bold uppercase tracking-wide hover:text-white transition-colors cursor-pointer"
            >
              📅 Mitad de Grupos (15 de Junio)
            </button>
            <button
              onClick={() => {
                setSimDate('2026-06-25');
                setSimHour('12:00');
                onUpdateConfig({
                  currentSimulatedTime: '2026-06-25T12:00:00Z',
                  isWorldCupStarted: true
                });
              }}
              className="text-[9px] text-left px-2.5 py-1.5 bg-black hover:bg-slate-900 border border-slate-850 rounded-sm font-mono text-slate-400 font-bold uppercase tracking-wide hover:text-white transition-colors cursor-pointer"
            >
              📅 Inicio Eliminación Directa
            </button>
          </div>
        </div>

        {/* 2. Record actual results */}
        <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850">
          <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-955">
            <Sliders size={11} />
            Ingresar Marcador Real
          </h4>

          <form onSubmit={handleMatchSubmit} className="space-y-3">
            <div>
              <label htmlFor="admin-match-select" className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 mb-1">Partido</label>
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
      </div>

      {/* Participant Management (Import/Export) */}
      <div className="bg-[#0A0C10] p-4 rounded-sm border border-slate-850 mb-5">
        <h4 className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-mono font-black mb-3 flex items-center justify-between pb-2 border-b border-slate-950">
          <span>👥 Gestión de Inscripciones (Base de Datos)</span>
          <span className="text-[9px] text-slate-500 lowercase font-normal italic">Consolidación de pollas</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Import Participant JSON */}
          <div className="space-y-2">
            <label htmlFor="import-json" className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500">
              📥 Importar Cartilla (Pegar JSON de jugador)
            </label>
            <textarea
              id="import-json"
              rows={3}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='Pegar aquí el JSON copiado por el jugador (ej: { "name": "...", "predictions": {...} })'
              className="w-full bg-black border border-slate-800 rounded-sm px-2.5 py-1.5 text-[10px] font-mono text-slate-300 outline-none focus:border-brand-amber resize-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!importJson.trim()) return;
                const success = onImportParticipant(importJson);
                if (success) {
                  alert("✅ Participante importado/actualizado con éxito.");
                  setImportJson('');
                } else {
                  alert("❌ Formato JSON inválido. Por favor verifica que copiaste el código completo.");
                }
              }}
              className="w-full py-1.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/30 text-[#10B981] hover:text-white font-mono text-[9px] font-black uppercase tracking-wider rounded-sm transition duration-150 cursor-pointer"
            >
              Cargar y Registrar Participante
            </button>
          </div>

          {/* Export consolidated database */}
          <div className="flex flex-col justify-between space-y-2.5">
            <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
              <p><strong>¿Cómo consolidar la polla general?</strong></p>
              <ol className="list-decimal pl-4 space-y-1 mt-1 text-[9px] text-slate-500 font-mono">
                <li>Los jugadores entran a la app, se inscriben y llenan sus pronósticos.</li>
                <li>Copian sus datos usando el botón <strong>"Exportar Mi Cartilla"</strong> y te envían el texto.</li>
                <li>Pega cada texto a la izquierda y presiona <strong>"Cargar y Registrar"</strong>.</li>
                <li>Presiona el botón de abajo para copiar la base de datos oficial y pégala en <code>src/data/participants.json</code> de tu código.</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(participants, null, 2))
                    .then(() => alert("📋 Base de datos consolidada copiada al portapapeles. Pégala en src/data/participants.json"))
                    .catch(() => alert("Error al copiar al portapapeles."));
                }}
                className="flex-1 py-2 bg-brand-amber/20 hover:bg-brand-amber/30 border border-brand-amber/30 text-brand-amber hover:text-white font-mono text-[9px] font-black uppercase tracking-wider rounded-sm transition duration-150 cursor-pointer text-center"
              >
                📋 Copiar DB para Repositorio
              </button>

              <button
                type="button"
                onClick={onClearAllParticipants}
                className="py-2 px-3 bg-red-950/20 hover:bg-red-950/30 border border-red-900/10 text-rose-400 hover:text-white font-mono text-[9px] font-black uppercase tracking-wider rounded-sm transition duration-150 cursor-pointer text-center"
              >
                🗑️ Borrar Locales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick simulations block */}
      <div className="border-t border-slate-850 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
          Simuladores Automáticos de la Copa:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={onSimulateGroups}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-black hover:bg-slate-900 text-slate-400 hover:text-white rounded-sm border border-slate-800 transition-colors font-mono text-[10px] uppercase tracking-wider cursor-pointer"
          >
            <PlayCircle size={12} className="text-brand-cyan" />
            Grupos
          </button>
          <button
            onClick={onSimulateFullTournament}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-black hover:bg-slate-900 text-[#F59E0B] hover:text-white rounded-sm border border-slate-800 transition-colors font-mono text-[10px] uppercase tracking-wider cursor-pointer"
          >
            <Star size={12} className="text-brand-amber" />
            Todo el Mundial
          </button>
          <button
            onClick={onResetTournament}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-rose-950/20 hover:bg-rose-950/30 text-rose-400 rounded-sm border border-rose-900/10 transition-colors font-mono text-[10px] uppercase tracking-wider cursor-pointer"
          >
            <Trash2 size={12} />
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
