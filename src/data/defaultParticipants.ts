import { Participant, Match } from '../types';
import { generateRandomPredictions, calculateParticipantPoints } from '../utils/points';

export function getPreseededParticipants(matches: Match[]): Participant[] {
  // Let's create some realistic mock participants
  const contestants = [
    {
      id: 'edier@geohazard.com',
      name: 'Edier Aristizábal',
      email: 'edier@geohazard.com',
      avatarUrl: 'av_1', // Delantero
    },
    {
      id: 'camila@mundial2026.com',
      name: 'Camila Giraldo',
      email: 'camila@mundial2026.com',
      avatarUrl: 'av_6', // Tsunami Táctico
    },
    {
      id: 'sebastian@goles.com',
      name: 'Sebastián Restrepo',
      email: 'sebastian@goles.com',
      avatarUrl: 'av_3', // Arquero Imbatible
    },
    {
      id: 'diego@futbolero.com',
      name: 'Diego Pérez',
      email: 'diego@futbolero.com',
      avatarUrl: 'av_2', // Director Técnico
    },
    {
      id: 'bot_hazard@geohazard.com',
      name: 'Simulador Geohazard',
      email: 'bot_hazard@geohazard.com',
      avatarUrl: 'av_5', // Volcán Activo
    }
  ];

  return contestants.map((c) => {
    // Generate a completed set of randomized predictions for these participants
    const predictions = generateRandomPredictions(matches);

    // Let any preseeded participants have isCompleted: true
    return {
      id: mungeEmail(c.email),
      name: c.name,
      email: c.email,
      avatarUrl: c.avatarUrl,
      predictions,
      points: 0, // calculated later
      stats: { correctWinner: 0, correctExactScore: 0, correctQualifiedTeams: 0 },
      hasAutoFilled: false,
      isCompleted: true
    };
  });
}

// Ensure the email is standard lowercase
export function mungeEmail(email: string): string {
  return email.trim().toLowerCase();
}
