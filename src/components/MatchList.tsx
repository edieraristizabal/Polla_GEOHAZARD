import React, { useState } from 'react';
import { Calendar, Lock, Unlock, HelpCircle, Save, Shuffle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Match, MatchPrediction, Participant, Team } from '../types';
import { TEAMS } from '../data/teams';

interface MatchListProps {
  matches: Match[];
  predictions: Record<string, MatchPrediction>;
  activeParticipant: Participant | null;
  currentSimulatedTime: string;
  isWorldCupStarted: boolean;
  onSavePrediction: (matchId: string, homeScore: number, awayScore: number, winnerIdToAdvance?: string | null) => void;
  onRandomizeRemaining: () => void;
}

export function MatchList({
  matches,
  predictions,
  activeParticipant,
  currentSimulatedTime,
  isWorldCupStarted,
  onSavePrediction,
  onRandomizeRemaining
}: MatchListProps) {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockouts'>('groups');
  const [editingScores, setEditingScores] = useState<Record<string, { home: string; away: string; winnerIdToAdvance: string | null }>>({});

  const getTeamInfo = (teamId: string | null): Team | null => {
    if (!teamId) return null;
    return TEAMS.find((t) => t.id === teamId) || null;
  };

  // Check if a match is locked according to the strict 5-minute pre-kickoff rules
  const getLockStatus = (m: Match) => {
    const kickoff = new Date(m.kickoffTime).getTime();
    const nowSim = new Date(currentSimulatedTime).getTime();
    const nowReal = Date.now();
    const effectiveNow = Math.max(nowReal, nowSim);
    const FIVE_MINUTES = 5 * 60 * 1000;

    const isWithinFiveMinutes = (kickoff - effectiveNow) < FIVE_MINUTES;
    const isStarted = effectiveNow >= kickoff;
    const isFinished = m.homeScore !== null && m.awayScore !== null;

    if (isFinished) {
      return { locked: true, reason: 'Partido Finalizado' };
    }
    if (isStarted) {
      return { locked: true, reason: 'Partido en curso / ya jugado' };
    }
    if (isWithinFiveMinutes) {
      return { locked: true, reason: 'Bloqueado (Faltan menos de 5 Minutos)' };
    }

    return { locked: false, reason: 'Editable' };
  };

  const handleScoreChange = (matchId: string, side: 'home' | 'away', val: string) => {
    // Sanitise
    const cleanVal = val.replace(/[^0-9]/g, '');
    const current = editingScores[matchId] || {
      home: predictions[matchId]?.homeScore?.toString() ?? '',
      away: predictions[matchId]?.awayScore?.toString() ?? '',
      winnerIdToAdvance: predictions[matchId]?.winnerIdToAdvance ?? null
    };

    const updated = {
      ...current,
      [side]: cleanVal
    };

    setEditingScores((prev) => ({
      ...prev,
      [matchId]: updated
    }));
  };

  const selectAdvancingWinner = (matchId: string, teamId: string | null) => {
    const current = editingScores[matchId] || {
      home: predictions[matchId]?.homeScore?.toString() ?? '',
      away: predictions[matchId]?.awayScore?.toString() ?? '',
      winnerIdToAdvance: predictions[matchId]?.winnerIdToAdvance ?? null
    };

    const updated = {
      ...current,
      winnerIdToAdvance: teamId
    };

    setEditingScores((prev) => ({
      ...prev,
      [matchId]: updated
    }));

    // Auto-save if scores already entered
    if (updated.home !== '' && updated.away !== '') {
      onSavePrediction(
        matchId,
        parseInt(updated.home, 10),
        parseInt(updated.away, 10),
        teamId
      );
    }
  };

  const handleSave = (matchId: string) => {
    const editState = editingScores[matchId];
    if (!editState) return;

    const homeScoreNum = parseInt(editState.home, 10);
    const awayScoreNum = parseInt(editState.away, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      return;
    }

    let advWinner = editState.winnerIdToAdvance;
    const m = matches.find((x) => x.id === matchId);
    if (m && m.stage !== 'groups' && homeScoreNum !== awayScoreNum) {
      // For knockouts, if it's not a draw, select the actual winner automatically
      advWinner = homeScoreNum > awayScoreNum ? m.homeTeamId : m.awayTeamId;
    }

    onSavePrediction(matchId, homeScoreNum, awayScoreNum, advWinner);
  };

  const formatKickoff = (kickoffStr: string) => {
    const d = new Date(kickoffStr);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  };

  const getRemainingTime = (m: Match) => {
    const kickoff = new Date(m.kickoffTime).getTime();
    const nowSim = new Date(currentSimulatedTime).getTime();
    const nowReal = Date.now();
    const effectiveNow = Math.max(nowReal, nowSim);
    const diff = kickoff - effectiveNow;

    if (diff <= 0) return 'Jugándose o Finalizado';
    
    // Minutes remaining
    const minsTotal = Math.floor(diff / (1000 * 60));
    if (minsTotal < 60) return `Cierra en ${minsTotal}m`;

    const hoursTotal = Math.floor(minsTotal / 60);
    const daysTotal = Math.floor(hoursTotal / 24);

    if (daysTotal > 0) return `Faltan ${daysTotal}d ${hoursTotal % 24}h`;
    return `Cierra en ${hoursTotal}h ${minsTotal % 60}m`;
  };

  const filteredMatches = matches.filter((m) => {
    if (activeTab === 'groups') {
      return m.stage === 'groups';
    } else {
      return m.stage !== 'groups';
    }
  });

  return (
    <div className="bg-bg-card border border-slate-800 rounded-sm p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
        {/* Navigation Tabs */}
        <div className="flex bg-[#0A0C10] p-1 rounded-sm border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-sm transition-all cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-brand-primary text-black font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fase de Grupos (A-L)
          </button>
          <button
            onClick={() => setActiveTab('knockouts')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-sm transition-all cursor-pointer ${
              activeTab === 'knockouts'
                ? 'bg-brand-primary text-black font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Eliminatorias Directas
          </button>
        </div>

        {/* Global Action */}
        {activeParticipant && !isWorldCupStarted && activeParticipant.status !== 'pending' && (
          <button
            onClick={onRandomizeRemaining}
            className="flex items-center gap-1.5 py-2 px-4.5 text-[10px] font-black font-mono text-black bg-brand-cyan hover:bg-opacity-95 rounded-sm transition duration-150 uppercase tracking-wider cursor-pointer shadow-md shadow-brand-cyan/10"
          >
            <Shuffle size={12} />
            Auto-completar vacíos
          </button>
        )}
      </div>

      {!activeParticipant ? (
        <div className="text-center py-10 bg-[#0A0C10]/60 rounded-sm border border-slate-800/80">
          <AlertTriangle className="mx-auto text-amber-500 mb-2 animate-bounce" size={24} />
          <p className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Menú Espectador</p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto font-mono">
            Selecciona o registra un participante en la cabecera superior para ajustar su cartilla de pronósticos.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-[10px] font-mono uppercase font-bold tracking-widest bg-[#0A0C10] border border-slate-850 p-3 rounded-sm flex items-center justify-between text-slate-400">
            <div>
              Editando pronósticos de:{' '}
              <span className="text-brand-primary font-black">{activeParticipant.name}</span>
            </div>
            <div>
              {activeParticipant.status === 'pending' ? (
                <span className="text-amber-500 font-bold bg-amber-950/20 border border-amber-900/20 px-2 py-0.5 rounded-sm">⏳ PENDIENTE DE APROBACIÓN</span>
              ) : isWorldCupStarted ? (
                <span className="text-rose-500 font-bold bg-rose-950/20 border border-rose-900/20 px-2 py-0.5 rounded-sm">⚠️ MUNDIAL EN JUEGO</span>
              ) : (
                <span className="text-brand-primary font-bold bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-sm">✅ Cartilla Abierta</span>
              )}
            </div>
          </div>

          {activeParticipant.status === 'pending' && (
            <div className="mb-4 p-4 bg-amber-950/20 border border-amber-900/50 text-amber-300 font-mono text-xs rounded-sm">
              <span className="font-bold uppercase block mb-1">Inscripción Pendiente</span>
              Tu inscripción está siendo validada por el administrador (Edier Aristizabal).
              Para acelerar el proceso, asegúrate de haber enviado el correo de solicitud. 
              Una vez aprobado, se habilitará la edición de tus predicciones.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((m) => {
              const homeTeam = getTeamInfo(m.homeTeamId);
              const awayTeam = getTeamInfo(m.awayTeamId);
              const pred = predictions[m.id];
              const lock = getLockStatus(m);
              const isLocked = lock.locked;

              const homeInputVal = editingScores[m.id]?.home ?? pred?.homeScore?.toString() ?? '';
              const awayInputVal = editingScores[m.id]?.away ?? pred?.awayScore?.toString() ?? '';
              const winnerAdv = editingScores[m.id]?.winnerIdToAdvance ?? pred?.winnerIdToAdvance ?? null;

              const isSavingDisabled = homeInputVal === '' || awayInputVal === '' || isLocked;
              
              // Highlight if predicted value and real value align
              const scoreEntered = pred !== undefined && pred.homeScore !== null && pred.homeScore !== undefined && pred.awayScore !== null && pred.awayScore !== undefined;
              const hasActualResult = m.homeScore !== null && m.awayScore !== null;

              return (
                <div
                  key={m.id}
                  className={`bg-bg-card border-l-4 border transition-all duration-150 rounded-sm p-4 ${
                    lock.locked
                      ? 'border-slate-800 border-l-slate-700 opacity-75 bg-[#0A0C10]/50'
                      : scoreEntered
                        ? 'border-slate-800 border-l-brand-primary shadow-sm bg-slate-900/10'
                        : 'border-slate-850 border-l-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top card metadata */}
                  <div className="flex items-center justify-between border-b border-slate-950 pb-2 mb-3 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 font-bold">
                      <Calendar size={11} className="text-brand-primary" />
                      {formatKickoff(m.kickoffTime)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold tracking-wider ${
                      isLocked ? 'bg-rose-950/20 text-rose-400 border border-rose-900/10' : 'bg-[#0A0C10] text-emerald-400 border border-emerald-950'
                    }`}>
                      {isLocked ? (activeParticipant?.status === 'pending' ? 'Pendiente aprobación' : lock.reason) : getRemainingTime(m)}
                    </span>
                  </div>

                  {/* Teams and Fields Row */}
                  <div className="flex items-center justify-between gap-1">
                    {/* Home Team */}
                    <div className="flex-1 text-center sm:text-left flex flex-col sm:flex-row items-center gap-2 max-w-[40%]">
                      <span className="text-2xl filter drop-shadow">
                        {homeTeam?.flagEmoji || '🏟️'}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-200 block uppercase font-mono tracking-tight text-sm">
                          {homeTeam?.code || m.placeholderHome || 'TBD'}
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:block truncate">
                          {homeTeam?.name || 'Clasificando...'}
                        </span>
                      </div>
                    </div>

                    {/* Scores Inputs */}
                    <div className="flex items-center gap-1.5">
                      <input
                        aria-label={`Goles de ${homeTeam?.name || m.placeholderHome || 'Local'}`}
                        type="text"
                        disabled={isLocked}
                        value={homeInputVal}
                        placeholder="-"
                        onChange={(e) => handleScoreChange(m.id, 'home', e.target.value)}
                        className={`w-9 h-9 text-center rounded-none border font-mono text-base font-bold outline-none focus:border-brand-primary transition-colors ${
                          isLocked
                            ? 'bg-slate-950 border-slate-850 text-slate-600'
                            : 'bg-black border-slate-700 text-white'
                        }`}
                      />
                      <span className="text-slate-600 font-bold font-mono">-</span>
                      <input
                        aria-label={`Goles de ${awayTeam?.name || m.placeholderAway || 'Visitante'}`}
                        type="text"
                        disabled={isLocked}
                        value={awayInputVal}
                        placeholder="-"
                        onChange={(e) => handleScoreChange(m.id, 'away', e.target.value)}
                        className={`w-9 h-9 text-center rounded-none border font-mono text-base font-bold outline-none focus:border-brand-primary transition-colors ${
                          isLocked
                            ? 'bg-slate-950 border-slate-850 text-slate-600'
                            : 'bg-black border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center sm:text-right flex flex-col sm:flex-row-reverse items-center gap-2 max-w-[40%]">
                      <span className="text-2xl filter drop-shadow ml-0 sm:ml-2">
                        {awayTeam?.flagEmoji || '🏟️'}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-200 block uppercase font-mono tracking-tight text-sm">
                          {awayTeam?.code || m.placeholderAway || 'TBD'}
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:block truncate">
                          {awayTeam?.name || 'Clasificando...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Knockout extra winner definition (penalties solver) */}
                  {m.stage !== 'groups' && homeInputVal !== '' && awayInputVal !== '' && homeInputVal === awayInputVal && (
                    <div className="mt-3 bg-slate-950/70 p-2.5 rounded-sm border border-slate-850 text-center">
                      <div className="text-[9px] text-[#A3A3C2] font-mono uppercase mb-1.5 tracking-wider">
                        Empate en eliminación directa. Define quién avanza:
                      </div>
                      <div className="flex justify-center gap-1.5">
                        <button
                          disabled={isLocked}
                          onClick={() => selectAdvancingWinner(m.id, m.homeTeamId)}
                          className={`px-3 py-1 text-[10px] rounded-sm transition font-bold font-mono uppercase ${
                            winnerAdv === m.homeTeamId
                              ? 'bg-brand-primary text-black'
                              : 'bg-black border border-slate-850 hover:bg-slate-900 text-slate-400'
                          }`}
                        >
                          {homeTeam?.code || m.placeholderHome || 'Local'}
                        </button>
                        <button
                          disabled={isLocked}
                          onClick={() => selectAdvancingWinner(m.id, m.awayTeamId)}
                          className={`px-3 py-1 text-[10px] rounded-sm transition font-bold font-mono uppercase ${
                            winnerAdv === m.awayTeamId
                              ? 'bg-brand-primary text-black'
                              : 'bg-black border border-slate-850 hover:bg-slate-900 text-slate-400'
                          }`}
                        >
                          {awayTeam?.code || m.placeholderAway || 'Visitante'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Save single match */}
                  <div className="mt-3 pt-2.5 border-t border-slate-950 flex items-center justify-between gap-1.5">
                    <div className="text-[9px] font-mono uppercase font-bold tracking-tight">
                      {scoreEntered ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={9} /> {pred.homeScore}-{pred.awayScore}
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <HelpCircle size={9} /> pendiente
                        </span>
                      )}
                    </div>

                    {!lock.locked && (
                      <button
                        title="Guardar de forma manual para este partido"
                        disabled={isSavingDisabled}
                        onClick={() => handleSave(m.id)}
                        className={`px-3.5 py-1 rounded-sm text-[10px] font-bold font-mono transition-all duration-150 flex items-center gap-1 uppercase tracking-wider ${
                          isSavingDisabled
                            ? 'bg-slate-900/60 text-slate-500 cursor-not-allowed border border-slate-850/40'
                            : 'bg-transparent hover:bg-brand-primary border border-brand-primary/50 text-brand-primary hover:text-black cursor-pointer'
                        }`}
                      >
                        <Save size={10} />
                        Guardar
                      </button>
                    )}
                  </div>

                  {/* Show actual scores if completed */}
                  {hasActualResult && (
                    <div className="mt-2 bg-[#0A0C10] border border-slate-800 py-1.5 px-2.5 rounded-sm text-center text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest">
                      Marcador Real:{' '}
                      <span className="text-brand-primary text-xs ml-1">
                        {m.homeScore} : {m.awayScore}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
