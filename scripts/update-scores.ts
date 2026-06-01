import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ApiTeam {
  id: string;
  fifa_code: string;
  name_en: string;
}

interface ApiGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  finished: string;
  type: string;
}

interface Match {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  stage: 'groups' | 'round_of_16' | 'quarters' | 'semis' | 'final';
  group: string | null;
  kickoffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerIdToAdvance?: string | null;
  description?: string;
}

async function run() {
  try {
    console.log('Fetching teams from worldcup26.ir...');
    const teamsRes = await fetch('https://worldcup26.ir/get/teams');
    const teamsData = (await teamsRes.json()) as { teams: ApiTeam[] };
    
    const teamsMap: Record<string, string> = {}; // API ID -> FIFA CODE
    teamsData.teams.forEach((t) => {
      teamsMap[t.id] = t.fifa_code;
    });
    
    console.log('Fetching games from worldcup26.ir...');
    const gamesRes = await fetch('https://worldcup26.ir/get/games');
    const gamesData = (await gamesRes.json()) as { games: ApiGame[] };
    
    const matchesPath = path.join(__dirname, '../public/data/matches.json');
    const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8')) as Match[];

    // 1. Group Stage mapping
    const apiGroupGames = gamesData.games.filter((g) => g.type === 'group');
    let groupUpdated = 0;
    
    apiGroupGames.forEach((game) => {
      const homeCode = teamsMap[game.home_team_id];
      const awayCode = teamsMap[game.away_team_id];
      if (!homeCode || !awayCode) return;
      
      const match = matches.find(
        (m) => m.stage === 'groups' && m.homeTeamId === homeCode && m.awayTeamId === awayCode
      );
      
      if (match) {
        const isFinished = game.finished && game.finished.toUpperCase() === 'TRUE';
        if (!isFinished) {
          if (match.homeScore !== null || match.awayScore !== null) {
            match.homeScore = null;
            match.awayScore = null;
            groupUpdated++;
          }
          return;
        }

        const homeScore = game.home_score !== 'null' && game.home_score !== null ? Number(game.home_score) : null;
        const awayScore = game.away_score !== 'null' && game.away_score !== null ? Number(game.away_score) : null;
        
        if (homeScore !== null && awayScore !== null) {
          if (match.homeScore !== homeScore || match.awayScore !== awayScore) {
            match.homeScore = homeScore;
            match.awayScore = awayScore;
            groupUpdated++;
          }
        }
      }
    });
    
    console.log(`Updated ${groupUpdated} group stage matches.`);

    // 2. Knockout stages mapping
    // We sort our knockout matches by ID (e.g. M_OF1, M_OF2...) and API games of that type by their API ID.
    const stagesMapping: { appStage: Match['stage']; apiType: string }[] = [
      { appStage: 'round_of_16', apiType: 'r16' },
      { appStage: 'quarters', apiType: 'qf' },
      { appStage: 'semis', apiType: 'sf' },
      { appStage: 'final', apiType: 'final' }
    ];

    stagesMapping.forEach(({ appStage, apiType }) => {
      const appMatches = matches
        .filter((m) => m.stage === appStage)
        .sort((a, b) => a.id.localeCompare(b.id));
        
      const apiMatches = gamesData.games
        .filter((g) => g.type === apiType)
        .sort((a, b) => Number(a.id) - Number(b.id));

      appMatches.forEach((match, index) => {
        const game = apiMatches[index];
        if (!game) return;

        const homeCode = teamsMap[game.home_team_id];
        const awayCode = teamsMap[game.away_team_id];
        
        // Update teams
        if (homeCode) match.homeTeamId = homeCode;
        if (awayCode) match.awayTeamId = awayCode;
        
        const isFinished = game.finished && game.finished.toUpperCase() === 'TRUE';
        if (!isFinished) {
          if (match.homeScore !== null || match.awayScore !== null || match.winnerIdToAdvance) {
            match.homeScore = null;
            match.awayScore = null;
            match.winnerIdToAdvance = null;
          }
          return;
        }

        // Update scores
        const homeScore = game.home_score !== 'null' && game.home_score !== null ? Number(game.home_score) : null;
        const awayScore = game.away_score !== 'null' && game.away_score !== null ? Number(game.away_score) : null;
        
        if (homeScore !== null && awayScore !== null) {
          match.homeScore = homeScore;
          match.awayScore = awayScore;
          
          // Determine winner
          if (homeScore > awayScore) {
            match.winnerIdToAdvance = match.homeTeamId;
          } else if (awayScore > homeScore) {
            match.winnerIdToAdvance = match.awayTeamId;
          } else {
            // It's a draw, check who advanced in the API.
            const qualifiedTeamId = findQualifiedTeamInNextRounds(game.home_team_id, game.away_team_id, gamesData.games, apiType);
            if (qualifiedTeamId) {
              match.winnerIdToAdvance = teamsMap[qualifiedTeamId];
            } else {
              match.winnerIdToAdvance = match.homeTeamId; // Fallback
            }
          }
        }
      });
    });

    // Write back the updated matches.json
    fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
    console.log('Matches updated and resolved successfully!');
  } catch (err) {
    console.error('Failed to update scores:', err);
    process.exit(1);
  }
}

// Check which of the two teams qualified in the next rounds of the API
function findQualifiedTeamInNextRounds(teamAId: string, teamBId: string, allGames: ApiGame[], currentApiType: string): string | null {
  // Look for any game of next stage types where one of these two teams is playing
  const nextStageTypes: Record<string, string[]> = {
    'r16': ['qf', 'sf', 'final'],
    'qf': ['sf', 'final'],
    'sf': ['final']
  };
  
  const typesToSearch = nextStageTypes[currentApiType] || [];
  
  for (const game of allGames) {
    if (typesToSearch.includes(game.type)) {
      if (game.home_team_id === teamAId || game.away_team_id === teamAId) {
        return teamAId;
      }
      if (game.home_team_id === teamBId || game.away_team_id === teamBId) {
        return teamBId;
      }
    }
  }
  return null;
}

run();
