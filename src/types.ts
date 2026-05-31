export interface Participant {
  id: string; // usually email
  name: string;
  email: string;
  avatarUrl: string;
  predictions: Record<string, MatchPrediction>; // key: matchId
  points: number;
  stats: {
    correctWinner: number;        // +1 pt
    correctExactScore: number;    // +1 additional pt
    correctQualifiedTeams: number;// +1 pt for each correct team in subsequent rounds
  };
  hasAutoFilled: boolean;         // true if assigned randomly before tournament start
  isCompleted: boolean;           // true if has full checklist of predictions defined
}

export interface Team {
  id: string;
  name: string;
  code: string; // 3-letter FIFA code
  flagEmoji: string;
  group: string; // 'A' through 'L' (48 teams)
}

export type TournamentStage = 
  | 'groups' 
  | 'round_of_32' 
  | 'round_of_16' 
  | 'quarters' 
  | 'semis' 
  | 'final';

export interface Match {
  id: string;
  homeTeamId: string | null;     // null if it's knockout and not yet decided
  awayTeamId: string | null;     // null if it's knockout and not yet decided
  placeholderHome?: string;      // e.g. "1º Grupo A"
  placeholderAway?: string;      // e.g. "2º Grupo B"
  stage: TournamentStage;
  group: string | null;          // 'A'..'L' for groups, null for knockouts
  kickoffTime: string;           // ISO 8601 string - used for edit lock logic
  homeScore: number | null;      // Actual result
  awayScore: number | null;      // Actual result
  winnerIdToAdvance?: string | null; // Necessary for knockout draw resolution (penalties)
  description: string;           // Match name/number
}

export interface MatchPrediction {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerIdToAdvance?: string | null; // prediction of which team advances in case of a draw in knockouts
}

export interface TournamentConfig {
  startedAt: string;             // ISO Date when World Cup kicks off
  currentSimulatedTime: string;  // ISO Date of simulated time (for testing locking mechanics)
  isWorldCupStarted: boolean;    // true if currentSimulatedTime >= startedAt
}
