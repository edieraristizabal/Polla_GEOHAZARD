export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'av_1', name: 'Delantero Estrella', emoji: '⚽', bgColor: 'bg-lime-500/20 text-lime-400' },
  { id: 'av_2', name: 'Director Técnico', emoji: '👔', bgColor: 'bg-cyan-500/20 text-cyan-400' },
  { id: 'av_3', name: 'Arquero Imbatible', emoji: '🧤', bgColor: 'bg-amber-500/20 text-amber-400' },
  { id: 'av_4', name: 'Fanático Fiel', emoji: '📣', bgColor: 'bg-rose-500/20 text-rose-400' },
  { id: 'av_5', name: 'Volcán Activo', emoji: '🌋', bgColor: 'bg-orange-500/20 text-orange-400' },
  { id: 'av_6', name: 'Tsunami Táctico', emoji: '🌊', bgColor: 'bg-blue-500/20 text-blue-400' },
  { id: 'av_7', name: 'Terremoto Deportivo', emoji: '⛰️', bgColor: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'av_8', name: 'Súper Árbitro', emoji: '🟨', bgColor: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'av_9', name: 'Copa Dorada', emoji: '🏆', bgColor: 'bg-purple-500/20 text-purple-400' }
];
