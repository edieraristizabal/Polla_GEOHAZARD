import React, { useState, useEffect } from 'react';
import { Trophy, ShieldAlert, Award, PlayCircle, Star, Sparkles, HelpCircle, GraduationCap } from 'lucide-react';
import { Header } from './components/Header';
import { Leaderboard } from './components/Leaderboard';
import { MatchList } from './components/MatchList';
import { UserProfile } from './components/UserProfile';
import { MatchAdmin } from './components/MatchAdmin';
import { INITIAL_MATCHES } from './data/matches';
import { getPreseededParticipants } from './data/defaultParticipants';
import { Participant, Match, TournamentConfig, Team } from './types';
import { TEAMS, GROUPS } from './data/teams';
import {
  resolveTournamentPositions,
  calculateParticipantPoints,
  generateRandomPredictions,
  calculateGroupStandings
} from './utils/points';

// May 31, 2026 - 11 days before the Cup!
const INITIAL_SIM_TIME = '2026-05-31T16:18:19Z';
const WC_START_TIME = '2026-06-11T18:00:00Z';

export default function App() {
  // --- STATE ---
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [config, setConfig] = useState<TournamentConfig>({
    startedAt: WC_START_TIME,
    currentSimulatedTime: INITIAL_SIM_TIME,
    isWorldCupStarted: false
  });

  const [selectedGroupStandings, setSelectedGroupStandings] = useState<string>('A');

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Load config
    const savedConfig = localStorage.getItem('geohazard_config');
    let activeConfig = config;
    if (savedConfig) {
      try {
        activeConfig = JSON.parse(savedConfig);
        setConfig(activeConfig);
      } catch (e) {
        console.error('Error loading config', e);
      }
    }

    // 2. Load matches
    const savedMatches = localStorage.getItem('geohazard_matches');
    let loadedMatches: Match[] = INITIAL_MATCHES;
    if (savedMatches) {
      try {
        loadedMatches = JSON.parse(savedMatches);
      } catch (e) {
        console.error('Error loading matches', e);
      }
    }

    // 3. Load participants (Merge official repository list with local overrides)
    const officialParticipants = getPreseededParticipants(loadedMatches);
    const savedPart = localStorage.getItem('geohazard_participants');
    let localParticipants: Participant[] = [];
    if (savedPart) {
      try {
        localParticipants = JSON.parse(savedPart);
      } catch (e) {
        console.error('Error loading local participants', e);
      }
    }

    // Merge: official repository participants always take precedence, and local-only ones are appended
    const loadedParticipants = [...officialParticipants];
    localParticipants.forEach((lp) => {
      if (!loadedParticipants.some((op) => op.id === lp.id)) {
        loadedParticipants.push(lp);
      }
    });

    // Run propagation and points matching once to make sure lists are perfectly synced
    // Before loading to state:
    const { resolvedMatches, updatedParticipants } = runRecalculation(loadedMatches, loadedParticipants);

    setMatches(resolvedMatches);
    setParticipants(updatedParticipants);

    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
    localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));

    // 4. Active participant
    const savedActiveId = localStorage.getItem('geohazard_active_id');
    if (savedActiveId && updatedParticipants.some(p => p.id === savedActiveId)) {
      setActiveParticipantId(savedActiveId);
    } else if (updatedParticipants.length > 0) {
      // Default to first participant if active participant not set
      setActiveParticipantId(updatedParticipants[0].id);
    } else {
      setActiveParticipantId(null);
    }
  }, []);

  // --- UTILITY TO COMMENCE RESOLUTION PIPELINE ---
  const runRecalculation = (currentMatches: Match[], currentParticipants: Participant[]): { resolvedMatches: Match[], updatedParticipants: Participant[] } => {
    // Resolve teams playing in Octavos -> Final
    const resolved = resolveTournamentPositions(currentMatches);

    // Calculate actual points for every single participant in the pool
    const updated = currentParticipants.map((p) => {
      const { points, stats } = calculateParticipantPoints(p.predictions, resolved);
      return {
        ...p,
        points,
        stats
      };
    });

    return { resolvedMatches: resolved, updatedParticipants: updated };
  };

  // --- ACTIONS ---

  // Update Config Date and lock status
  const handleUpdateConfig = (updated: Partial<TournamentConfig>) => {
    const nextConfig = {
      ...config,
      ...updated
    };
    setConfig(nextConfig);
    localStorage.setItem('geohazard_config', JSON.stringify(nextConfig));

    // Evaluate temporal rule immediately!
    const simTime = nextConfig.currentSimulatedTime;
    const isStarted = new Date(simTime).getTime() >= new Date(WC_START_TIME).getTime();

    if (isStarted) {
      let triggeredAutofill = false;
      const nextParticipants = participants.map((p) => {
        // Find if they have any missing or blank predictions
        let incomplete = false;
        matches.forEach((m) => {
          const pred = p.predictions[m.id];
          if (!pred || pred.homeScore === null || pred.awayScore === null) {
            incomplete = true;
          }
        });

        if (incomplete) {
          triggeredAutofill = true;
          const userPred = { ...p.predictions };
          const rand = generateRandomPredictions(matches);

          matches.forEach((m) => {
            const pred = userPred[m.id];
            if (!pred || pred.homeScore === null || pred.awayScore === null) {
              userPred[m.id] = rand[m.id];
            }
          });

          return {
            ...p,
            predictions: userPred,
            isCompleted: true,
            hasAutoFilled: true
          };
        }
        return p;
      });

      if (triggeredAutofill) {
        const { resolvedMatches, updatedParticipants } = runRecalculation(matches, nextParticipants);
        setParticipants(updatedParticipants);
        setMatches(resolvedMatches);
        localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
        localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
      }
    }
  };

  const handleResetTime = () => {
    handleUpdateConfig({
      currentSimulatedTime: INITIAL_SIM_TIME,
      isWorldCupStarted: false
    });
  };

  const handleSelectParticipant = (id: string | null) => {
    setActiveParticipantId(id);
    if (id) {
      localStorage.setItem('geohazard_active_id', id);
    } else {
      localStorage.removeItem('geohazard_active_id');
    }
  };

  // User Registers
  const handleRegisterParticipant = (name: string, email: string, avatarId: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const newParticipant: Participant = {
      id: cleanEmail,
      name,
      email: cleanEmail,
      avatarUrl: avatarId,
      predictions: {},
      points: 0,
      stats: { correctWinner: 0, correctExactScore: 0, correctQualifiedTeams: 0 },
      hasAutoFilled: false,
      isCompleted: false
    };

    const nextParticipants = [...participants, newParticipant];
    
    // Evaluate if world cup is already started and assign random predictions immediately!
    const isStarted = new Date(config.currentSimulatedTime).getTime() >= new Date(WC_START_TIME).getTime();
    if (isStarted) {
      newParticipant.predictions = generateRandomPredictions(matches);
      newParticipant.isCompleted = true;
      newParticipant.hasAutoFilled = true;
    }

    const { resolvedMatches, updatedParticipants } = runRecalculation(matches, nextParticipants);

    setParticipants(updatedParticipants);
    setMatches(resolvedMatches);
    setActiveParticipantId(cleanEmail);

    localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
    localStorage.setItem('geohazard_active_id', cleanEmail);
  };

  // User saves a prediction
  const handleSavePrediction = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    winnerIdToAdvance?: string | null
  ) => {
    if (!activeParticipantId) return;

    // Strict 5-minute pre-kickoff lockout verification
    const m = matches.find((x) => x.id === matchId);
    if (!m) return;

    const kickoff = new Date(m.kickoffTime).getTime();
    const nowSim = new Date(config.currentSimulatedTime).getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (kickoff - nowSim < FIVE_MINUTES) {
      alert("⚠️ REGLAMENTO DE REGISTRO LOCKOUT: Los pronósticos deben ingresarse hasta un máximo de 5 minutos antes del partido oficial.");
      return;
    }

    const nextParticipants = participants.map((p) => {
      if (p.id === activeParticipantId) {
        const userPred = { ...p.predictions };
        userPred[matchId] = {
          matchId,
          homeScore,
          awayScore,
          winnerIdToAdvance: winnerIdToAdvance ?? null
        };

        // Determine if they completed all matches
        let count = 0;
        matches.forEach((game) => {
          const prediction = userPred[game.id];
          if (prediction && prediction.homeScore !== null && prediction.awayScore !== null) {
            count += 1;
          }
        });

        return {
          ...p,
          predictions: userPred,
          isCompleted: count === matches.length
        };
      }
      return p;
    });

    const { resolvedMatches, updatedParticipants } = runRecalculation(matches, nextParticipants);

    setParticipants(updatedParticipants);
    setMatches(resolvedMatches);

    localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
  };

  // Pre-fill rest randomly (Client side option)
  const handleRandomizeRemaining = () => {
    if (!activeParticipantId) return;

    const activeUser = participants.find((p) => p.id === activeParticipantId);
    if (!activeUser) return;

    const currentPred = { ...activeUser.predictions };
    const randomPred = generateRandomPredictions(matches);

    matches.forEach((m) => {
      const pred = currentPred[m.id];
      if (!pred || pred.homeScore === null || pred.awayScore === null) {
        currentPred[m.id] = randomPred[m.id];
      }
    });

    const nextParticipants = participants.map((p) => {
      if (p.id === activeParticipantId) {
        return {
          ...p,
          predictions: currentPred,
          isCompleted: true
        };
      }
      return p;
    });

    const { resolvedMatches, updatedParticipants } = runRecalculation(matches, nextParticipants);

    setParticipants(updatedParticipants);
    setMatches(resolvedMatches);

    localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
  };

  // ADMIN: Save actual results of a match
  const handleUpdateMatchScore = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    winnerIdToAdvance?: string | null
  ) => {
    const nextMatches = matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore,
          awayScore,
          winnerIdToAdvance: winnerIdToAdvance ?? null
        };
      }
      return m;
    });

    const { resolvedMatches, updatedParticipants } = runRecalculation(nextMatches, participants);

    setMatches(resolvedMatches);
    setParticipants(updatedParticipants);

    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
    localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
  };

  // ADMIN: Simulated full group stage scores generator
  const handleSimulateGroups = () => {
    // 1. Advance clock to Octavos kickoff
    const simTime = '2026-06-25T12:00:00Z';
    
    // 2. Auto-generate results for Groups matches
    const updatedMatches = matches.map((m) => {
      if (m.stage === 'groups') {
        // Generate realistic scores e.g. 0-3
        const scoreH = Math.floor(Math.random() * 4);
        const scoreA = Math.floor(Math.random() * 4);
        return {
          ...m,
          homeScore: scoreH,
          awayScore: scoreA
        };
      }
      return m;
    });

    // 3. For any user who didn't fill out predictions, enforce the random auto-fill before calculating points!
    const updatedParticipants = participants.map((p) => {
      let incomplete = false;
      const predictionsCopy = { ...p.predictions };

      matches.forEach((m) => {
        const pred = predictionsCopy[m.id];
        if (!pred || pred.homeScore === null || pred.awayScore === null) {
          incomplete = true;
        }
      });

      if (incomplete) {
        const rand = generateRandomPredictions(matches);
        matches.forEach((m) => {
          const pred = predictionsCopy[m.id];
          if (!pred || pred.homeScore === null || pred.awayScore === null) {
            predictionsCopy[m.id] = rand[m.id];
          }
        });

        return {
          ...p,
          predictions: predictionsCopy,
          hasAutoFilled: true,
          isCompleted: true
        };
      }
      return p;
    });

    const { resolvedMatches, updatedParticipants: finalPart } = runRecalculation(updatedMatches, updatedParticipants);

    setMatches(resolvedMatches);
    setParticipants(finalPart);
    setConfig({
      startedAt: WC_START_TIME,
      currentSimulatedTime: simTime,
      isWorldCupStarted: true
    });

    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
    localStorage.setItem('geohazard_participants', JSON.stringify(finalPart));
    localStorage.setItem('geohazard_config', JSON.stringify({
      startedAt: WC_START_TIME,
      currentSimulatedTime: simTime,
      isWorldCupStarted: true
    }));
  };

  // ADMIN: Simulates all matches up to the Champion!
  const handleSimulateFullTournament = () => {
    // Force Groups simulation first
    let stageMatches = [...matches];

    // Helper to generate a score that is not a draw for non-group matches, or resolve via penalties
    const simGame = (m: Match) => {
      const scoreH = Math.floor(Math.random() * 4);
      const scoreA = Math.floor(Math.random() * 4);
      let winnerId: string | null = null;
      if (scoreH === scoreA) {
        winnerId = Math.random() > 0.5 ? m.homeTeamId || null : m.awayTeamId || null;
      }
      return { home: scoreH, away: scoreA, winner: winnerId };
    };

    // Simulate in sequence (Groups, then Octavos, then Quarters, Semis, Final)
    // Run Groups
    stageMatches = stageMatches.map((m) => {
      if (m.stage === 'groups') {
        const h = Math.floor(Math.random() * 4);
        const a = Math.floor(Math.random() * 4);
        return { ...m, homeScore: h, awayScore: a };
      }
      return m;
    });

    // Populate Octavos de Final slots
    let tempResolved = resolveTournamentPositions(stageMatches);

    // Run Octavos
    tempResolved = tempResolved.map((m) => {
      if (m.stage === 'round_of_16') {
        const sim = simGame(m);
        return { ...m, homeScore: sim.home, awayScore: sim.away, winnerIdToAdvance: sim.winner };
      }
      return m;
    });

    // Populate Quarters slots
    tempResolved = resolveTournamentPositions(tempResolved);

    // Run Quarters
    tempResolved = tempResolved.map((m) => {
      if (m.stage === 'quarters') {
        const sim = simGame(m);
        return { ...m, homeScore: sim.home, awayScore: sim.away, winnerIdToAdvance: sim.winner };
      }
      return m;
    });

    // Populate Semis
    tempResolved = resolveTournamentPositions(tempResolved);

    // Run Semis
    tempResolved = tempResolved.map((m) => {
      if (m.stage === 'semis') {
        const sim = simGame(m);
        return { ...m, homeScore: sim.home, awayScore: sim.away, winnerIdToAdvance: sim.winner };
      }
      return m;
    });

    // Populate Final
    tempResolved = resolveTournamentPositions(tempResolved);

    // Run Final
    tempResolved = tempResolved.map((m) => {
      if (m.stage === 'final') {
        const sim = simGame(m);
        return { ...m, homeScore: sim.home, awayScore: sim.away, winnerIdToAdvance: sim.winner };
      }
      return m;
    });

    // Recalculate everything!
    // Handle late competitors autofill:
    const updatedParticipants = participants.map((p) => {
      let incomplete = false;
      const predictionsCopy = { ...p.predictions };

      matches.forEach((m) => {
        const pred = predictionsCopy[m.id];
        if (!pred || pred.homeScore === null || pred.awayScore === null) {
          incomplete = true;
        }
      });

      if (incomplete) {
        const rand = generateRandomPredictions(matches);
        matches.forEach((m) => {
          const pred = predictionsCopy[m.id];
          if (!pred || pred.homeScore === null || pred.awayScore === null) {
            predictionsCopy[m.id] = rand[m.id];
          }
        });

        return {
          ...p,
          predictions: predictionsCopy,
          hasAutoFilled: true,
          isCompleted: true
        };
      }
      return p;
    });

    const { resolvedMatches, updatedParticipants: finalPart } = runRecalculation(tempResolved, updatedParticipants);

    const simTimeFinal = '2026-07-20T12:00:00Z'; // Time after physical final

    setMatches(resolvedMatches);
    setParticipants(finalPart);
    setConfig({
      startedAt: WC_START_TIME,
      currentSimulatedTime: simTimeFinal,
      isWorldCupStarted: true
    });

    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
    localStorage.setItem('geohazard_participants', JSON.stringify(finalPart));
    localStorage.setItem('geohazard_config', JSON.stringify({
      startedAt: WC_START_TIME,
      currentSimulatedTime: simTimeFinal,
      isWorldCupStarted: true
    }));
  };

  // ADMIN: Total reset back to zero
  const handleResetTournament = () => {
    const rawMatches = INITIAL_MATCHES.map((m) => {
      return {
        ...m,
        homeScore: null,
        awayScore: null,
        winnerIdToAdvance: null,
        homeTeamId: m.stage === 'groups' ? m.homeTeamId : null,
        awayTeamId: m.stage === 'groups' ? m.awayTeamId : null
      };
    });

    // Clear actual points but preserve user accounts and custom predictions if they were made before starting!
    const targetParticipants = participants.map((p) => {
      return {
        ...p,
        points: 0,
        stats: { correctWinner: 0, correctExactScore: 0, correctQualifiedTeams: 0 },
        hasAutoFilled: false,
        isCompleted: Object.keys(p.predictions).length === rawMatches.length
      };
    });

    const { resolvedMatches, updatedParticipants } = runRecalculation(rawMatches, targetParticipants);

    setMatches(resolvedMatches);
    setParticipants(updatedParticipants);
    setConfig({
      startedAt: WC_START_TIME,
      currentSimulatedTime: INITIAL_SIM_TIME,
      isWorldCupStarted: false
    });

    localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
    localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
    localStorage.setItem('geohazard_config', JSON.stringify({
      startedAt: WC_START_TIME,
      currentSimulatedTime: INITIAL_SIM_TIME,
      isWorldCupStarted: false
    }));
  };

  // ADMIN: Import player cartilla from JSON
  const handleImportParticipant = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.name || !data.email || !data.predictions) {
        return false;
      }
      const cleanEmail = data.email.trim().toLowerCase();
      const importedParticipant: Participant = {
        id: cleanEmail,
        name: data.name.trim(),
        email: cleanEmail,
        avatarUrl: data.avatarUrl || 'av_1',
        predictions: data.predictions,
        points: 0,
        stats: { correctWinner: 0, correctExactScore: 0, correctQualifiedTeams: 0 },
        hasAutoFilled: data.hasAutoFilled || false,
        isCompleted: data.isCompleted || false
      };

      const filtered = participants.filter((p) => p.email.toLowerCase() !== cleanEmail);
      const nextParticipants = [...filtered, importedParticipant];

      const { resolvedMatches, updatedParticipants } = runRecalculation(matches, nextParticipants);

      setParticipants(updatedParticipants);
      setMatches(resolvedMatches);
      localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
      localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // ADMIN: Clear all local participants
  const handleClearAllParticipants = () => {
    if (window.confirm("¿Estás seguro de borrar todos los participantes locales del navegador?")) {
      setParticipants([]);
      setActiveParticipantId(null);
      localStorage.removeItem('geohazard_participants');
      localStorage.removeItem('geohazard_active_id');
    }
  };

  // Active user's predictions list
  const activeUser = participants.find((p) => p.id === activeParticipantId) || null;
  const predictionsActive = activeUser ? activeUser.predictions : {};

  // Group standings solver
  const currentGroupStandings = calculateGroupStandings(selectedGroupStandings, matches);

  return (
    <div className="min-h-screen bg-bg-darkest text-slate-100 flex flex-col">
      <Header
        config={config}
        onResetTime={handleResetTime}
        activeParticipant={activeUser}
        participants={participants}
        onSelectParticipant={handleSelectParticipant}
      />

      {/* Main Grid View */}
      <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main area: Matches or Standings Leaderboards */}
        <section className="lg:col-span-8 space-y-6">
          {/* Leaders board standings always visible on top of main content */}
          <Leaderboard
            participants={participants}
            matches={matches}
            activeParticipantId={activeParticipantId}
          />

          {/* Match selection card list */}
          <MatchList
            matches={matches}
            predictions={predictionsActive}
            activeParticipant={activeUser}
            currentSimulatedTime={config.currentSimulatedTime}
            isWorldCupStarted={config.isWorldCupStarted}
            onSavePrediction={handleSavePrediction}
            onRandomizeRemaining={handleRandomizeRemaining}
          />

          {/* Dedicated Admin simulator */}
          <MatchAdmin
            config={config}
            matches={matches}
            participants={participants}
            onUpdateConfig={handleUpdateConfig}
            onUpdateMatchScore={handleUpdateMatchScore}
            onSimulateGroups={handleSimulateGroups}
            onSimulateFullTournament={handleSimulateFullTournament}
            onResetTournament={handleResetTournament}
            onImportParticipant={handleImportParticipant}
            onClearAllParticipants={handleClearAllParticipants}
          />
        </section>

        {/* Right sidebar area: Profile, rules and real world standings solver */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Participant enrollment & profile overview */}
          <UserProfile
            activeParticipant={activeUser}
            participants={participants}
            matches={matches}
            onRegisterParticipant={handleRegisterParticipant}
            onSelectParticipant={handleSelectParticipant}
          />

          {/* World Cup 2026 Group state standing solver */}
          <div className="bg-bg-card border border-slate-800 rounded-sm p-4.5 shadow-md">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 font-mono mb-3.5 flex items-center justify-between pb-2 border-b border-slate-950">
              <span>STANDINGS REALES</span>
              <span className="text-[9px] text-brand-primary lowercase font-normal italic">en directo</span>
            </h4>

            {/* Select Group */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-3 border-b border-slate-950 scrollbar-none">
              {GROUPS.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroupStandings(grp)}
                  className={`px-2.5 py-1 text-[11px] rounded-none transition uppercase font-black font-mono shrink-0 cursor-pointer ${
                    selectedGroupStandings === grp
                      ? 'bg-brand-primary text-black'
                      : 'bg-[#0A0C10] text-slate-400 hover:text-white border border-slate-850'
                  }`}
                >
                  G-{grp}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-12 text-[9px] text-slate-500 font-mono font-black uppercase pb-1 border-b border-slate-955">
                <span className="col-span-5">Equipo</span>
                <span className="col-span-2 text-center">PJ</span>
                <span className="col-span-3 text-center">DG (GF-GC)</span>
                <span className="col-span-2 text-right">Pts</span>
              </div>

              {currentGroupStandings.map((st, index) => {
                const team = TEAMS.find((t) => t.id === st.teamId);
                const isQualifying = index < 2; // top 2 qualify
                return (
                  <div
                     key={st.teamId}
                     className="grid grid-cols-12 text-xs py-1.5 border-b border-slate-900/40 items-center font-medium"
                  >
                    <span className="col-span-5 truncate flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-bold text-center w-4 h-4 flex items-center justify-center rounded-none shrink-0 ${
                        isQualifying ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' : 'bg-slate-950 text-slate-600 border border-slate-900'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-lg filter drop-shadow">{team?.flagEmoji}</span>
                      <span className="font-bold text-slate-300 font-mono">{team?.code}</span>
                    </span>
                    <span className="col-span-2 text-center font-mono text-slate-500">{st.gamesPlayed}</span>
                    <span className="col-span-3 text-center font-mono text-[10px] text-slate-400">
                      {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}{' '}
                      <span className="text-[9px] text-slate-505">
                        ({st.goalsFor}:{st.goalsAgainst})
                      </span>
                    </span>
                    <span className="col-span-2 text-right font-mono font-bold text-slate-300">{st.points}</span>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[9px] text-slate-500 font-mono mt-3.5 text-center leading-normal uppercase font-bold tracking-tight">
              🏆 Los 2 mejores de cada grupo avanzan.
            </p>
          </div>

          {/* Custom Pool rules sheet */}
          <div className="bg-bg-card border border-slate-800 rounded-sm p-4.5 shadow-md">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-[#E2E8F0] font-mono mb-3.5 flex items-center gap-1.5 pb-2 border-b border-slate-950">
              <GraduationCap className="text-brand-cyan shrink-0" size={13} />
              Reglamento Geohazard
            </h4>
            <ul className="space-y-3 text-[11px] text-slate-400 leading-relaxed font-sans">
              <li className="flex gap-2">
                <span className="text-brand-primary font-bold shrink-0">■</span>
                <span>
                  <strong>Acierto de Ganador (+1 pt):</strong> Sí aciertas quién gana (o empate).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-primary font-bold shrink-0">■</span>
                <span>
                  <strong>Marcador Exacto (+1 pt):</strong> Sí aciertas los goles exactos.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-primary font-bold shrink-0">■</span>
                <span>
                  <strong>Clasificados (+1 pt):</strong> Por cada país en fases de eliminación directa.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-primary font-bold shrink-0">■</span>
                <span>
                  <strong>Empate en Eliminatoria (+1 pt):</strong> Si predices empate en eliminación directa y aciertas quién avanza por penales.
                </span>
              </li>
              <li className="flex gap-2 border-t border-slate-900 pt-2.5">
                <span className="text-brand-amber font-bold shrink-0">▲</span>
                <span>
                  <strong>Cierre de Partido:</strong> Autocierre <strong>5 minutos antes</strong>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-amber font-bold shrink-0">▲</span>
                <span>
                  <strong>Cartilla Completa:</strong> Pendientes se auto-completan con resultados aleatorios al inicio del mundial.
                </span>
              </li>
            </ul>
          </div>

        </aside>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-[#0A0C10] text-slate-500 text-center font-mono text-[10px] select-none uppercase tracking-wider">
        <p>© 2026 Geohazard Polla Mundialista. Todos los derechos reservados.</p>
        <p className="mt-1 text-slate-600 lowercase tracking-wide font-sans font-bold font-normal">Diseñado con precisión táctica y reglas inviolables.</p>
      </footer>
    </div>
  );
}
