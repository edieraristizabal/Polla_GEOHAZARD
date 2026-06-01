import React, { useState, useEffect } from 'react';
import { Trophy, ShieldAlert, Award, PlayCircle, Star, Sparkles, HelpCircle, GraduationCap } from 'lucide-react';
import { Header } from './components/Header';
import { Leaderboard } from './components/Leaderboard';
import { MatchList } from './components/MatchList';
import { UserProfile } from './components/UserProfile';
import { MatchAdmin } from './components/MatchAdmin';
import { GroupStandingsGrid } from './components/GroupStandingsGrid';
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
const WC_START_TIME = '2026-06-11T15:00:00Z';

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
  const [activeMainTab, setActiveMainTab] = useState<'matches' | 'standings'>('matches');

  const [githubPat, setGithubPat] = useState<string>(() => localStorage.getItem('geohazard_github_pat') || '');
  const [pendingApproval, setPendingApproval] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ email: string; data: string } | null>(null);
  const [isCommiting, setIsCommiting] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [githubPatInput, setGithubPatInput] = useState<string>(() => localStorage.getItem('geohazard_github_pat') || '');
  const [showAdminSyncModal, setShowAdminSyncModal] = useState<boolean>(false);

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

  const saveParticipantsToGitHub = async (updatedList: Participant[], token: string) => {
    const owner = 'edieraristizabal';
    const repo = 'Polla_GEOHAZARD';
    const path = 'public/data/participants.json';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    const content = JSON.stringify(updatedList, null, 2);
    
    // 1. Get current SHA
    let sha = '';
    try {
      const res = await fetch(url, {
        headers: { 
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
      }
    } catch (e) {
      console.error('Error fetching SHA from GitHub', e);
    }
    
    // 2. Commit update
    const body = {
      message: 'admin: update participants list from app UI',
      content: btoa(unescape(encodeURIComponent(content))),
      sha: sha || undefined
    };
    
    const commitRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(body)
    });
    
    if (!commitRes.ok) {
      const err = await commitRes.json();
      throw new Error(err.message || 'Error al guardar en GitHub');
    }
  };

  const handleApproveParticipantDirectly = (email: string) => {
    const p = participants.find(part => part.email.toLowerCase() === email.toLowerCase());
    if (p) {
      setPendingApproval({ name: p.name, email: p.email, avatar: p.avatarUrl });
    }
  };

  const handleRejectParticipantDirectly = async (email: string) => {
    if (!window.confirm(`¿Estás seguro de rechazar/eliminar al participante con correo: ${email}?`)) {
      return;
    }
    const token = githubPat || prompt('Ingrese su GitHub Personal Access Token (PAT) para eliminar de GitHub permanentemente:');
    if (!token) return;
    
    setIsCommiting(true);
    try {
      const nextParticipants = participants.filter(p => p.email.toLowerCase() !== email.toLowerCase());
      const { resolvedMatches, updatedParticipants: finalPart } = runRecalculation(matches, nextParticipants);
      
      await saveParticipantsToGitHub(finalPart, token);
      
      setParticipants(finalPart);
      localStorage.setItem('geohazard_participants', JSON.stringify(finalPart));
      
      if (token !== githubPat) {
        setGithubPat(token);
        localStorage.setItem('geohazard_github_pat', token);
      }
      alert('Participante rechazado/eliminado correctamente.');
    } catch (e: any) {
      alert(`Error al rechazar en GitHub: ${e.message}`);
    } finally {
      setIsCommiting(false);
    }
  };

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

    async function loadData() {
      // 2. Fetch matches from public/data/matches.json, fallback to localStorage/static
      let loadedMatches: Match[] = INITIAL_MATCHES;
      try {
        const res = await fetch('./data/matches.json?t=' + Date.now());
        if (res.ok) {
          const remoteMatches = await res.json();
          if (remoteMatches && Array.isArray(remoteMatches) && remoteMatches.length > 0) {
            loadedMatches = remoteMatches;
          }
        }
      } catch (e) {
        console.warn('Could not fetch remote matches, using offline fallback', e);
        const savedMatches = localStorage.getItem('geohazard_matches');
        if (savedMatches) {
          try {
            loadedMatches = JSON.parse(savedMatches);
          } catch (err) {
            console.error('Error loading matches from localstorage', err);
          }
        }
      }

      // 3. Fetch participants from public/data/participants.json, fallback to localStorage/default
      let baseParticipants: Participant[] = getPreseededParticipants(loadedMatches);
      try {
        const res = await fetch('./data/participants.json?t=' + Date.now());
        if (res.ok) {
          const remoteParticipants = await res.json();
          if (remoteParticipants && Array.isArray(remoteParticipants)) {
            baseParticipants = remoteParticipants;
          }
        }
      } catch (e) {
        console.warn('Could not fetch remote participants, using offline fallback', e);
      }

      const savedPart = localStorage.getItem('geohazard_participants');
      let localParticipants: Participant[] = [];
      if (savedPart) {
        try {
          localParticipants = JSON.parse(savedPart);
        } catch (e) {
          console.error('Error loading local participants', e);
        }
      }

      // Merge: fetched / base participants always take precedence, and local-only ones are appended
      const loadedParticipants = [...baseParticipants];
      localParticipants.forEach((lp) => {
        if (!loadedParticipants.some((op) => op.id === lp.id)) {
          loadedParticipants.push(lp);
        }
      });

      // Run propagation and points matching once to make sure lists are perfectly synced
      const { resolvedMatches, updatedParticipants } = runRecalculation(loadedMatches, loadedParticipants);

      setMatches(resolvedMatches);
      setParticipants(updatedParticipants);

      localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
      localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));

      // 4. Active participant
      const savedActiveId = localStorage.getItem('geohazard_active_id');
      let finalActiveId: string | null = null;
      if (savedActiveId && updatedParticipants.some(p => p.id === savedActiveId)) {
        finalActiveId = savedActiveId;
      } else if (updatedParticipants.length > 0) {
        finalActiveId = updatedParticipants[0].id;
      }
      setActiveParticipantId(finalActiveId);

      // 5. Check URL parameters for approval requests & predictions import
      const urlParams = new URLSearchParams(window.location.search);
      const approveName = urlParams.get('approve_name');
      const approveEmail = urlParams.get('approve_email');
      const approveAvatar = urlParams.get('approve_avatar');
      
      const importPredictions = urlParams.get('import_predictions');
      const importEmail = urlParams.get('email');
      const importData = urlParams.get('data');

      if (approveName && approveEmail && approveAvatar) {
        setPendingApproval({ name: approveName, email: approveEmail, avatar: approveAvatar });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (importPredictions === 'true' && importEmail && importData) {
        setPendingImport({ email: importEmail, data: importData });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    loadData();

    // Periodic synchronization
    const interval = setInterval(async () => {
      try {
        const res = await fetch('./data/matches.json?t=' + Date.now());
        if (res.ok) {
          const remoteMatches = await res.json();
          if (remoteMatches && Array.isArray(remoteMatches) && remoteMatches.length > 0) {
            let baseParticipants: Participant[] = [];
            try {
              const pres = await fetch('./data/participants.json?t=' + Date.now());
              if (pres.ok) {
                const remoteParticipants = await pres.json();
                if (remoteParticipants && Array.isArray(remoteParticipants)) {
                  baseParticipants = remoteParticipants;
                }
              }
            } catch (err) {
              console.warn('Could not fetch remote participants in interval', err);
            }

            const savedPart = localStorage.getItem('geohazard_participants');
            let localParticipants: Participant[] = [];
            if (savedPart) {
              try {
                localParticipants = JSON.parse(savedPart);
              } catch (e) {
                console.error('Error loading local participants in interval', e);
              }
            }

            const loadedParticipants = [...baseParticipants];
            localParticipants.forEach((lp) => {
              if (!loadedParticipants.some((op) => op.id === lp.id)) {
                loadedParticipants.push(lp);
              }
            });

            setMatches((currMatches) => {
              const { resolvedMatches, updatedParticipants } = runRecalculation(remoteMatches, loadedParticipants);
              setParticipants(updatedParticipants);
              localStorage.setItem('geohazard_matches', JSON.stringify(resolvedMatches));
              localStorage.setItem('geohazard_participants', JSON.stringify(updatedParticipants));
              return resolvedMatches;
            });
          }
        }
      } catch (e) {
        console.warn('Periodic sync failed', e);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

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
    if (id === 'edieraristizabal@gmail.com') {
      const code = prompt('Ingrese la contraseña de administrador para iniciar sesión:');
      if (code !== 'geohazard2026') {
        alert('Contraseña de administrador incorrecta.');
        return;
      }
    }
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
    
    // Admin bypasses approval
    const isEdier = cleanEmail === 'edieraristizabal@gmail.com';
    const initialStatus = isEdier ? undefined : 'pending';

    const newParticipant: Participant = {
      id: cleanEmail,
      name,
      email: cleanEmail,
      avatarUrl: avatarId,
      predictions: {},
      points: 0,
      stats: { correctWinner: 0, correctExactScore: 0, correctQualifiedTeams: 0 },
      hasAutoFilled: false,
      isCompleted: false,
      status: initialStatus
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

    // If not Edier, open the email composer to request approval
    if (!isEdier) {
      const subject = encodeURIComponent(`Inscripción Polla Geohazard: ${name}`);
      const approveUrl = `https://edieraristizabal.github.io/Polla_GEOHAZARD/?approve_name=${encodeURIComponent(name)}&approve_email=${encodeURIComponent(cleanEmail)}&approve_avatar=${encodeURIComponent(avatarId)}`;
      const body = encodeURIComponent(`Hola Edier,\n\nQuiero registrarme en la Polla Geohazard.\nNombre: ${name}\nCorreo: ${cleanEmail}\nAvatar: ${avatarId}\n\nPor favor aprueba mi inscripción haciendo clic en el siguiente enlace:\n${approveUrl}`);
      
      window.open(`mailto:edieraristizabal@gmail.com?subject=${subject}&body=${body}`, '_blank');
    }
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
    const effectiveNow = Math.max(Date.now(), nowSim);

    if (kickoff - effectiveNow < FIVE_MINUTES) {
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

  const handleApproveSubmission = async () => {
    if (!pendingApproval) return;
    if (adminPasswordInput !== 'geohazard2026') {
      alert('Contraseña de administrador incorrecta.');
      return;
    }
    const token = githubPatInput || githubPat;
    if (!token) {
      alert('Se requiere un GitHub Personal Access Token (PAT) para guardar el cambio en el repositorio.');
      return;
    }
    
    setIsCommiting(true);
    try {
      let updatedList = [...participants];
      const index = updatedList.findIndex(p => p.email.toLowerCase() === pendingApproval.email.toLowerCase());
      
      if (index >= 0) {
        updatedList[index] = {
          ...updatedList[index],
          status: undefined // Approved
        };
      } else {
        updatedList.push({
          id: pendingApproval.email.toLowerCase(),
          name: pendingApproval.name,
          email: pendingApproval.email.toLowerCase(),
          avatarUrl: pendingApproval.avatar,
          predictions: {},
          points: 0,
          stats: { correctWinner: 0, correctExactScore: 0, correctQualifiedTeams: 0 },
          hasAutoFilled: false,
          isCompleted: false,
          status: undefined // Approved
        });
      }

      const { resolvedMatches, updatedParticipants: finalPart } = runRecalculation(matches, updatedList);
      
      // Save to GitHub
      await saveParticipantsToGitHub(finalPart, token);
      
      setParticipants(finalPart);
      localStorage.setItem('geohazard_participants', JSON.stringify(finalPart));
      
      setGithubPat(token);
      localStorage.setItem('geohazard_github_pat', token);
      
      // Notify participant via mailto link
      const notifySubject = encodeURIComponent('Inscripción Aprobada - Polla Geohazard');
      const notifyBody = encodeURIComponent(`Hola ${pendingApproval.name},\n\nTu inscripción en la Polla Geohazard ha sido aprobada por el administrador.\n\nYa puedes ingresar a la aplicación y registrar tus predicciones:\nhttps://edieraristizabal.github.io/Polla_GEOHAZARD/\n\n¡Buena suerte!`);
      window.open(`mailto:${pendingApproval.email}?subject=${notifySubject}&body=${notifyBody}`, '_blank');
      
      alert(`Participante ${pendingApproval.name} aprobado y sincronizado en GitHub.`);
      setPendingApproval(null);
      setAdminPasswordInput('');
    } catch (e: any) {
      alert(`Error al guardar en GitHub: ${e.message}`);
    } finally {
      setIsCommiting(false);
    }
  };

  const handleImportSubmission = async () => {
    if (!pendingImport) return;
    const token = githubPatInput || githubPat;
    if (!token) {
      alert('Se requiere un GitHub Personal Access Token (PAT) para guardar el cambio en el repositorio.');
      return;
    }
    
    setIsCommiting(true);
    try {
      // Decode predictions from base64
      let decodedPredictions: Record<string, { homeScore: number | null; awayScore: number | null; winnerIdToAdvance?: string | null }> = {};
      try {
        const decodedStr = decodeURIComponent(atob(pendingImport.data));
        decodedPredictions = JSON.parse(decodedStr);
      } catch (e) {
        throw new Error('Formato de datos de pronósticos inválido o corrupto.');
      }
      
      const emailLower = pendingImport.email.toLowerCase();
      const existingUser = participants.find(p => p.email.toLowerCase() === emailLower);
      if (!existingUser) {
        throw new Error(`El participante con correo ${pendingImport.email} no existe o no ha sido aprobado aún.`);
      }
      
      // Update predictions, ensuring lockout rule isn't bypassed for any match that is within 5 minutes or already played
      const nextPredictions = { ...existingUser.predictions };
      let updatedCount = 0;
      let blockedCount = 0;
      
      const nowSim = new Date(config.currentSimulatedTime).getTime();
      const effectiveNow = Math.max(Date.now(), nowSim);
      const FIVE_MINUTES = 5 * 60 * 1000;
      
      Object.keys(decodedPredictions).forEach((matchId) => {
        const m = matches.find(x => x.id === matchId);
        if (m) {
          const kickoff = new Date(m.kickoffTime).getTime();
          if (kickoff - effectiveNow < FIVE_MINUTES) {
            blockedCount++;
          } else {
            nextPredictions[matchId] = decodedPredictions[matchId];
            updatedCount++;
          }
        }
      });
      
      const updatedList = participants.map(p => {
        if (p.email.toLowerCase() === emailLower) {
          return {
            ...p,
            predictions: nextPredictions,
            isCompleted: Object.keys(nextPredictions).length === matches.length
          };
        }
        return p;
      });
      
      const { resolvedMatches, updatedParticipants: finalPart } = runRecalculation(matches, updatedList);
      
      // Save to GitHub
      await saveParticipantsToGitHub(finalPart, token);
      
      setParticipants(finalPart);
      localStorage.setItem('geohazard_participants', JSON.stringify(finalPart));
      
      setGithubPat(token);
      localStorage.setItem('geohazard_github_pat', token);
      
      let message = `Se importaron ${updatedCount} pronósticos con éxito.`;
      if (blockedCount > 0) {
        message += `\n⚠️ ${blockedCount} pronósticos fueron omitidos por estar bajo restricción de lockout (menos de 5 minutos para el partido).`;
      }
      alert(message);
      setPendingImport(null);
    } catch (e: any) {
      alert(`Error al importar: ${e.message}`);
    } finally {
      setIsCommiting(false);
    }
  };

  const handleAdminSyncOwnPredictionsSubmit = async () => {
    const token = githubPatInput || githubPat;
    if (!token) {
      alert('Se requiere un GitHub Personal Access Token (PAT) para guardar el cambio en el repositorio.');
      return;
    }
    
    setIsCommiting(true);
    try {
      await saveParticipantsToGitHub(participants, token);
      
      setGithubPat(token);
      localStorage.setItem('geohazard_github_pat', token);
      
      alert('✅ ¡Tus pronósticos se han sincronizado con éxito en GitHub!');
      setShowAdminSyncModal(false);
    } catch (e: any) {
      alert(`Error al guardar en GitHub: ${e.message}`);
    } finally {
      setIsCommiting(false);
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

          {/* Navigation Tabs for left column */}
          <div className="flex border-b border-slate-900 bg-bg-card p-1 rounded-sm gap-1">
            <button
              onClick={() => setActiveMainTab('matches')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-[11px] uppercase font-black font-mono tracking-wider transition cursor-pointer select-none ${
                activeMainTab === 'matches'
                  ? 'bg-brand-primary text-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              📅 Partidos y Predicciones
            </button>
            <button
              onClick={() => setActiveMainTab('standings')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-[11px] uppercase font-black font-mono tracking-wider transition cursor-pointer select-none ${
                activeMainTab === 'standings'
                  ? 'bg-brand-primary text-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              📊 Clasificación de Grupos
            </button>
          </div>

          {/* Match selection card list */}
          {activeMainTab === 'matches' ? (
            <MatchList
              matches={matches}
              predictions={predictionsActive}
              activeParticipant={activeUser}
              currentSimulatedTime={config.currentSimulatedTime}
              isWorldCupStarted={config.isWorldCupStarted}
              onSavePrediction={handleSavePrediction}
              onRandomizeRemaining={handleRandomizeRemaining}
            />
          ) : (
            <GroupStandingsGrid matches={matches} />
          )}

          {/* Dedicated Admin simulator */}
          {activeParticipantId === 'edieraristizabal@gmail.com' && (
            <MatchAdmin
              config={config}
              matches={matches}
              participants={participants}
              githubPat={githubPat}
              onUpdateGithubPat={(token) => {
                setGithubPat(token);
                setGithubPatInput(token);
                localStorage.setItem('geohazard_github_pat', token);
              }}
              onApproveParticipantDirectly={handleApproveParticipantDirectly}
              onRejectParticipantDirectly={handleRejectParticipantDirectly}
              onUpdateConfig={handleUpdateConfig}
              onUpdateMatchScore={handleUpdateMatchScore}
            />
          )}
        </section>

        {/* Right sidebar area: Profile, rules and real world standings solver */}
        <aside className="lg:col-span-4 space-y-6">
          
          <UserProfile
            activeParticipant={activeUser}
            participants={participants}
            matches={matches}
            onRegisterParticipant={handleRegisterParticipant}
            onSelectParticipant={handleSelectParticipant}
            onAdminSyncOwnPredictions={() => setShowAdminSyncModal(true)}
          />

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

      {/* MODAL: PENDING APPROVAL */}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f1219] border border-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-900">
              <span className="text-xl font-sans">👤</span>
              <div>
                <h3 className="text-sm font-black font-mono uppercase tracking-wider text-slate-100">
                  Aprobación de Inscripción
                </h3>
                <p className="text-[11px] text-slate-400">
                  Valida la solicitud para ingresar a la polla
                </p>
              </div>
            </div>

            <div className="bg-[#080a0f] p-4 rounded border border-slate-900 flex items-center gap-3">
              <img
                src={`/data/avatars/${pendingApproval.avatar}`}
                alt="Avatar"
                className="w-12 h-12 rounded-full border border-brand-primary"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback';
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{pendingApproval.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{pendingApproval.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-[#080a0f] border border-slate-800 text-xs px-3 py-2 rounded focus:outline-none focus:border-brand-primary text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={githubPatInput}
                  onChange={(e) => setGithubPatInput(e.target.value)}
                  className="w-full bg-[#080a0f] border border-slate-800 text-xs px-3 py-2 rounded focus:outline-none focus:border-brand-primary text-white font-mono"
                />
                <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                  Necesario para actualizar el archivo `participants.json` directamente en el repositorio remoto.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setPendingApproval(null);
                  setAdminPasswordInput('');
                }}
                disabled={isCommiting}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[11px] font-black uppercase py-2 rounded transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApproveSubmission}
                disabled={isCommiting}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/80 text-black font-mono text-[11px] font-black uppercase py-2 rounded transition cursor-pointer disabled:opacity-50"
              >
                {isCommiting ? 'Guardando...' : 'Aprobar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENDING PREDICTIONS IMPORT */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f1219] border border-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-900">
              <span className="text-xl font-sans">📥</span>
              <div>
                <h3 className="text-sm font-black font-mono uppercase tracking-wider text-slate-100">
                  Importación de Pronósticos
                </h3>
                <p className="text-[11px] text-slate-400">
                  Importar pronósticos enviados por correo
                </p>
              </div>
            </div>

            <div className="bg-[#080a0f] p-3.5 rounded border border-slate-900">
              <p className="text-[11px] text-slate-400 leading-normal">
                Se detectó una solicitud de importación para el participante:
              </p>
              <p className="text-xs font-bold text-white font-mono mt-1 break-all">
                {pendingImport.email}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                GitHub Personal Access Token (PAT)
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                value={githubPatInput}
                onChange={(e) => setGithubPatInput(e.target.value)}
                className="w-full bg-[#080a0f] border border-slate-800 text-xs px-3 py-2 rounded focus:outline-none focus:border-brand-primary text-white font-mono"
              />
              <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                Necesario para actualizar el archivo `participants.json` directamente en el repositorio remoto.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPendingImport(null)}
                disabled={isCommiting}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[11px] font-black uppercase py-2 rounded transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportSubmission}
                disabled={isCommiting}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/80 text-black font-mono text-[11px] font-black uppercase py-2 rounded transition cursor-pointer disabled:opacity-50"
              >
                {isCommiting ? 'Importando...' : 'Importar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f1219] border border-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-900">
              <span className="text-xl font-sans">🔄</span>
              <div>
                <h3 className="text-sm font-black font-mono uppercase tracking-wider text-slate-100">
                  Sincronizar tus Pronósticos
                </h3>
                <p className="text-[11px] text-slate-400">
                  Guardar tus pronósticos directamente en GitHub
                </p>
              </div>
            </div>

            <div className="bg-[#080a0f] p-3.5 rounded border border-slate-900">
              <p className="text-[11px] text-slate-400 leading-normal">
                Como Administrador, puedes guardar tus cambios de pronósticos en la base de datos oficial remota directamente.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                GitHub Personal Access Token (PAT)
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                value={githubPatInput}
                onChange={(e) => setGithubPatInput(e.target.value)}
                className="w-full bg-[#080a0f] border border-slate-800 text-xs px-3 py-2 rounded focus:outline-none focus:border-brand-primary text-white font-mono"
              />
              <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                Necesario para actualizar el archivo `participants.json` directamente en el repositorio remoto.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAdminSyncModal(false)}
                disabled={isCommiting}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[11px] font-black uppercase py-2 rounded transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdminSyncOwnPredictionsSubmit}
                disabled={isCommiting}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/80 text-black font-mono text-[11px] font-black uppercase py-2 rounded transition cursor-pointer disabled:opacity-50"
              >
                {isCommiting ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
