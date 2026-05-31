import { Match, MatchPrediction, Participant, Team } from '../types';
import { TEAMS } from '../data/teams';

// Helper to calculate group standings
export interface GroupStanding {
  teamId: string;
  points: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function calculateGroupStandings(groupLetter: string, matches: Match[]): GroupStanding[] {
  const groupTeams = TEAMS.filter((t) => t.group === groupLetter);
  const standings: Record<string, GroupStanding> = {};

  // Initialize
  groupTeams.forEach((team) => {
    standings[team.id] = {
      teamId: team.id,
      points: 0,
      gamesPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    };
  });

  // Filter group matches
  const groupMatches = matches.filter((m) => m.stage === 'groups' && m.group === groupLetter);

  groupMatches.forEach((m) => {
    if (m.homeTeamId && m.awayTeamId && m.homeScore !== null && m.awayScore !== null) {
      const hId = m.homeTeamId;
      const aId = m.awayTeamId;
      const hScore = m.homeScore;
      const aScore = m.awayScore;

      // Ensure they exist in standings
      if (!standings[hId]) return;
      if (!standings[aId]) return;

      standings[hId].gamesPlayed += 1;
      standings[aId].gamesPlayed += 1;
      standings[hId].goalsFor += hScore;
      standings[hId].goalsAgainst += aScore;
      standings[aId].goalsFor += aScore;
      standings[aId].goalsAgainst += hScore;

      if (hScore > aScore) {
        standings[hId].points += 3;
      } else if (hScore < aScore) {
        standings[aId].points += 3;
      } else {
        standings[hId].points += 1;
        standings[aId].points += 1;
      }
    }
  });

  // Convert to array and update goal diffs
  return Object.values(standings).map((st) => {
    st.goalDifference = st.goalsFor - st.goalsAgainst;
    return st;
  }).sort((a, b) => {
    // Sort by points desc, then goal difference desc, then goals for desc, then alphabetical
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

/**
 * Propagates scores through the matches list to determine which teams play in subsequent rounds.
 */
export function resolveTournamentPositions(matches: Match[]): Match[] {
  // Create a deep copy to avoid mutations directly on the input
  const resolved = JSON.parse(JSON.stringify(matches)) as Match[];

  // 1. Calculate Group Winners and Runners-up
  const groupWinners: Record<string, string | null> = {};
  const groupRunnersUp: Record<string, string | null> = {};
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  letters.forEach((letter) => {
    const standings = calculateGroupStandings(letter, resolved);
    groupWinners[letter] = standings[0]?.teamId || null;
    groupRunnersUp[letter] = standings[1]?.teamId || null;
  });

  // Helper to find match by id in resolved array
  const findMatch = (id: string) => resolved.find((m) => m.id === id);

  // 2. Set Round of 16 (Octavos de Final) teams
  const of1 = findMatch('M_OF1');
  if (of1) {
    of1.homeTeamId = groupWinners['A'];
    of1.awayTeamId = groupRunnersUp['B'];
  }
  const of2 = findMatch('M_OF2');
  if (of2) {
    of2.homeTeamId = groupWinners['C'];
    of2.awayTeamId = groupRunnersUp['D'];
  }
  const of3 = findMatch('M_OF3');
  if (of3) {
    of3.homeTeamId = groupWinners['E'];
    of3.awayTeamId = groupRunnersUp['F'];
  }
  const of4 = findMatch('M_OF4');
  if (of4) {
    of4.homeTeamId = groupWinners['G'];
    of4.awayTeamId = groupRunnersUp['H'];
  }
  const of5 = findMatch('M_OF5');
  if (of5) {
    of5.homeTeamId = groupWinners['I'];
    of5.awayTeamId = groupRunnersUp['J'];
  }
  const of6 = findMatch('M_OF6');
  if (of6) {
    of6.homeTeamId = groupWinners['K'];
    of6.awayTeamId = groupRunnersUp['L'];
  }
  const of7 = findMatch('M_OF7');
  if (of7) {
    of7.homeTeamId = groupRunnersUp['A'];
    of7.awayTeamId = groupWinners['B'];
  }
  const of8 = findMatch('M_OF8');
  if (of8) {
    of8.homeTeamId = groupRunnersUp['C'];
    of8.awayTeamId = groupWinners['D'];
  }

  // Helper to determine winner id of a match in knockout stage
  const getKnockoutWinner = (m: Match | undefined): string | null => {
    if (!m || m.homeScore === null || m.awayScore === null) return null;
    if (m.homeScore > m.awayScore) return m.homeTeamId;
    if (m.homeScore < m.awayScore) return m.awayTeamId;
    // It is a draw, resolve via shootout prediction/result
    return m.winnerIdToAdvance || m.homeTeamId; // fallback
  };

  // 3. Set Quarterfinals teams
  const qf1 = findMatch('M_QF1');
  if (qf1) {
    qf1.homeTeamId = getKnockoutWinner(findMatch('M_OF1'));
    qf1.awayTeamId = getKnockoutWinner(findMatch('M_OF2'));
  }
  const qf2 = findMatch('M_QF2');
  if (qf2) {
    qf2.homeTeamId = getKnockoutWinner(findMatch('M_OF3'));
    qf2.awayTeamId = getKnockoutWinner(findMatch('M_OF4'));
  }
  const qf3 = findMatch('M_QF3');
  if (qf3) {
    qf3.homeTeamId = getKnockoutWinner(findMatch('M_OF5'));
    qf3.awayTeamId = getKnockoutWinner(findMatch('M_OF6'));
  }
  const qf4 = findMatch('M_QF4');
  if (qf4) {
    qf4.homeTeamId = getKnockoutWinner(findMatch('M_OF7'));
    qf4.awayTeamId = getKnockoutWinner(findMatch('M_OF8'));
  }

  // 4. Set Semifinals teams
  const sf1 = findMatch('M_SF1');
  if (sf1) {
    sf1.homeTeamId = getKnockoutWinner(findMatch('M_QF1'));
    sf1.awayTeamId = getKnockoutWinner(findMatch('M_QF2'));
  }
  const sf2 = findMatch('M_SF2');
  if (sf2) {
    sf2.homeTeamId = getKnockoutWinner(findMatch('M_QF3'));
    sf2.awayTeamId = getKnockoutWinner(findMatch('M_QF4'));
  }

  // 5. Set Grand Final teams
  const finalMatch = findMatch('M_F');
  if (finalMatch) {
    finalMatch.homeTeamId = getKnockoutWinner(findMatch('M_SF1'));
    finalMatch.awayTeamId = getKnockoutWinner(findMatch('M_SF2'));
  }

  return resolved;
}

/**
 * Calculates a participant's points and individual stats by comparing their
 * prediction map against the actual matches.
 */
export function calculateParticipantPoints(
  predictions: Record<string, MatchPrediction>,
  actualMatches: Match[]
): { points: number; stats: Participant['stats'] } {
  let points = 0;
  let correctWinner = 0;
  let correctExactScore = 0;
  let correctQualifiedTeams = 0;

  // Resolve teams in both actual and predicted tournament configurations
  // to properly check advancing team rewards (+1 point per correct team in Octavos, Quarters, Semis, Final, Champion).
  const resolvedActual = resolveTournamentPositions(actualMatches);

  // Construct a matches list representing the user's customized predictions
  const userMatches: Match[] = actualMatches.map((m) => {
    const pred = predictions[m.id];
    return {
      ...m,
      homeScore: pred?.homeScore ?? null,
      awayScore: pred?.awayScore ?? null,
      winnerIdToAdvance: pred?.winnerIdToAdvance ?? null
    };
  });
  const resolvedUser = resolveTournamentPositions(userMatches);

  // 1. Calculate Individual Match Prediction points
  actualMatches.forEach((m) => {
    const pred = predictions[m.id];
    if (!pred || pred.homeScore === null || pred.awayScore === null || m.homeScore === null || m.awayScore === null) {
      return;
    }

    const actH = m.homeScore;
    const actA = m.awayScore;
    const predH = pred.homeScore;
    const predA = pred.awayScore;

    // Check exact score
    const isExact = actH === predH && actA === predA;

    // Check outcome (winner or draw)
    const actualWinner = actH > actA ? 'H' : actH < actA ? 'A' : 'D';
    const predictedWinner = predH > predA ? 'H' : predH < predA ? 'A' : 'D';
    const isOutcomeCorrect = actualWinner === predictedWinner;

    if (isOutcomeCorrect) {
      correctWinner += 1;
      points += 1; // +1 point for correct outcome
      
      if (isExact) {
        correctExactScore += 1;
        points += 1; // +1 additional point for exact score
      }

      // Add 1 additional point if draw predicted in knockout and correct team selected to advance (penalties)
      if (m.stage !== 'groups' && actualWinner === 'D') {
        const predAdv = pred.winnerIdToAdvance;
        const actAdv = m.winnerIdToAdvance;
        if (predAdv && actAdv && predAdv === actAdv) {
          points += 1;
        }
      }
    }
  });

  // Helper collects set of team IDs that actually reached a specific stage
  const getTeamsInStage = (matchesList: Match[], stage: Match['stage']): Set<string> => {
    const teams = new Set<string>();
    matchesList
      .filter((m) => m.stage === stage)
      .forEach((m) => {
        if (m.homeTeamId) teams.add(m.homeTeamId);
        if (m.awayTeamId) teams.add(m.awayTeamId);
      });
    return teams;
  };

  // 2. Points for qualified teams (+1 for each team they guessed that actually reached that level)
  const stages: Match['stage'][] = ['round_of_16', 'quarters', 'semis', 'final'];
  stages.forEach((stg) => {
    const actualTeams = getTeamsInStage(resolvedActual, stg);
    const predictedTeams = getTeamsInStage(resolvedUser, stg);

    // If actual has teams loaded (i.e. matches have been input for group stage), compare
    if (actualTeams.size > 0) {
      predictedTeams.forEach((teamId) => {
        if (actualTeams.has(teamId)) {
          correctQualifiedTeams += 1;
          points += 1; // +1 point for each correctly predicted team in next round
        }
      });
    }
  });

  // 3. Point for champion
  const finalMatchActual = resolvedActual.find((m) => m.stage === 'final');
  const finalMatchUser = resolvedUser.find((m) => m.stage === 'final');

  if (finalMatchActual && finalMatchActual.homeScore !== null && finalMatchActual.awayScore !== null) {
    const actualChampion = finalMatchActual.homeScore > finalMatchActual.awayScore 
      ? finalMatchActual.homeTeamId 
      : finalMatchActual.homeScore < finalMatchActual.awayScore 
        ? finalMatchActual.awayTeamId 
        : finalMatchActual.winnerIdToAdvance || finalMatchActual.homeTeamId;

    const userChampion = finalMatchUser && finalMatchUser.homeScore !== null && finalMatchUser.awayScore !== null
      ? finalMatchUser.homeScore > finalMatchUser.awayScore 
        ? finalMatchUser.homeTeamId 
        : finalMatchUser.homeScore < finalMatchUser.awayScore 
          ? finalMatchUser.awayTeamId 
          : finalMatchUser.winnerIdToAdvance || finalMatchUser.homeTeamId
      : null;

    if (actualChampion && userChampion && actualChampion === userChampion) {
      correctQualifiedTeams += 1;
      points += 1; // +1 for correct champion
    }
  }

  return {
    points,
    stats: {
      correctWinner,
      correctExactScore,
      correctQualifiedTeams
    }
  };
}

/**
 * Auto-generates random predictions for a participant for all matches.
 */
export function generateRandomPredictions(matches: Match[]): Record<string, MatchPrediction> {
  const predictions: Record<string, MatchPrediction> = {};
  matches.forEach((m) => {
    // Generate scores between 0 and 4 with realistic probabilities (e.g., lower scores are more likely)
    const weights = [0.15, 0.35, 0.30, 0.15, 0.05]; // 0, 1, 2, 3, 4
    const getRandomScore = () => {
      const r = Math.random();
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (r <= sum) return i;
      }
      return 1;
    };

    const homeScore = getRandomScore();
    const awayScore = getRandomScore();
    
    // For knockouts, predict a winner to propagate in case of a draw
    let winnerIdToAdvance: string | null = null;
    if (homeScore === awayScore) {
      winnerIdToAdvance = Math.random() > 0.5 ? m.homeTeamId || null : m.awayTeamId || null;
    }

    predictions[m.id] = {
      matchId: m.id,
      homeScore,
      awayScore,
      winnerIdToAdvance
    };
  });
  return predictions;
}
