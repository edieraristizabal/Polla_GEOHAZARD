import { Match, Participant } from '../types';
import preseeded from './participants.json';

export function getPreseededParticipants(matches: Match[]): Participant[] {
  return preseeded as unknown as Participant[];
}

// Ensure the email is standard lowercase
export function mungeEmail(email: string): string {
  return email.trim().toLowerCase();
}
