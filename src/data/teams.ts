import { Team } from '../types';

export const TEAMS: Team[] = [
  // Grupo A
  { id: 'MEX', name: 'México', code: 'MEX', flagEmoji: '🇲🇽', group: 'A' },
  { id: 'USA', name: 'Estados Unidos', code: 'USA', flagEmoji: '🇺🇸', group: 'A' },
  { id: 'CAN', name: 'Canadá', code: 'CAN', flagEmoji: '🇨🇦', group: 'A' },
  { id: 'CMR', name: 'Camerún', code: 'CMR', flagEmoji: '🇨🇲', group: 'A' },

  // Grupo B
  { id: 'ARG', name: 'Argentina', code: 'ARG', flagEmoji: '🇦🇷', group: 'B' },
  { id: 'POL', name: 'Polonia', code: 'POL', flagEmoji: '🇵🇱', group: 'B' },
  { id: 'KSA', name: 'Arabia Saudita', code: 'KSA', flagEmoji: '🇸🇦', group: 'B' },
  { id: 'AUS', name: 'Australia', code: 'AUS', flagEmoji: '🇦🇺', group: 'B' },

  // Grupo C
  { id: 'FRA', name: 'Francia', code: 'FRA', flagEmoji: '🇫🇷', group: 'C' },
  { id: 'DEN', name: 'Dinamarca', code: 'DEN', flagEmoji: '🇩🇰', group: 'C' },
  { id: 'TUN', name: 'Túnez', code: 'TUN', flagEmoji: '🇹🇳', group: 'C' },
  { id: 'PER', name: 'Perú', code: 'PER', flagEmoji: '🇵🇪', group: 'C' },

  // Grupo D
  { id: 'ENG', name: 'Inglaterra', code: 'ENG', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'D' },
  { id: 'USA_D', name: 'Gales', code: 'WAL', flagEmoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', group: 'D' }, // Substitute Wales / alternative
  { id: 'IRN', name: 'Irán', code: 'IRN', flagEmoji: '🇮🇷', group: 'D' },
  { id: 'SEN', name: 'Senegal', code: 'SEN', flagEmoji: '🇸🇳', group: 'D' },

  // Grupo E
  { id: 'ESP', name: 'España', code: 'ESP', flagEmoji: '🇪🇸', group: 'E' },
  { id: 'GER', name: 'Alemania', code: 'GER', flagEmoji: '🇩🇪', group: 'E' },
  { id: 'JPN', name: 'Japón', code: 'JPN', flagEmoji: '🇯🇵', group: 'E' },
  { id: 'CRC', name: 'Costa Rica', code: 'CRC', flagEmoji: '🇨🇷', group: 'E' },

  // Grupo F
  { id: 'BEL', name: 'Bélgica', code: 'BEL', flagEmoji: '🇧🇪', group: 'F' },
  { id: 'CRO', name: 'Croacia', code: 'CRO', flagEmoji: '🇭🇷', group: 'F' },
  { id: 'MAR', name: 'Marruecos', code: 'MAR', flagEmoji: '🇲🇦', group: 'F' },
  { id: 'CAN_F', name: 'Canadá B', code: 'CAB', flagEmoji: '🇨🇦', group: 'F' }, // Simple placeholder to keep standard sizes or use alternate

  // Grupo G
  { id: 'BRA', name: 'Brasil', code: 'BRA', flagEmoji: '🇧🇷', group: 'G' },
  { id: 'SUI', name: 'Suiza', code: 'SUI', flagEmoji: '🇨🇭', group: 'G' },
  { id: 'SRB', name: 'Serbia', code: 'SRB', flagEmoji: '🇷🇸', group: 'G' },
  { id: 'GHA', name: 'Ghana', code: 'GHA', flagEmoji: '🇬🇭', group: 'G' },

  // Grupo H
  { id: 'POR', name: 'Portugal', code: 'POR', flagEmoji: '🇵🇹', group: 'H' },
  { id: 'URU', name: 'Uruguay', code: 'URU', flagEmoji: '🇺🇾', group: 'H' },
  { id: 'KOR', name: 'Corea del Sur', code: 'KOR', flagEmoji: '🇰🇷', group: 'H' },
  { id: 'ECU', name: 'Ecuador', code: 'ECU', flagEmoji: '🇪🇨', group: 'H' },

  // Grupo I
  { id: 'ITA', name: 'Italia', code: 'ITA', flagEmoji: '🇮🇹', group: 'I' },
  { id: 'COL', name: 'Colombia', code: 'COL', flagEmoji: '🇨🇴', group: 'I' },
  { id: 'SWE', name: 'Suecia', code: 'SWE', flagEmoji: '🇸🇪', group: 'I' },
  { id: 'NGA', name: 'Nigeria', code: 'NGA', flagEmoji: '🇳🇬', group: 'I' },

  // Grupo J
  { id: 'NED', name: 'Países Bajos', code: 'NED', flagEmoji: '🇳🇱', group: 'J' },
  { id: 'CHI', name: 'Chile', code: 'CHI', flagEmoji: '🇨🇱', group: 'J' },
  { id: 'UKR', name: 'Ucrania', code: 'UKR', flagEmoji: '🇺🇦', group: 'J' },
  { id: 'EGY', name: 'Egipto', code: 'EGY', flagEmoji: '🇪🇬', group: 'J' },

  // Grupo K
  { id: 'AUT', name: 'Austria', code: 'AUT', flagEmoji: '🇦🇹', group: 'K' },
  { id: 'PAR', name: 'Paraguay', code: 'PAR', flagEmoji: '🇵🇾', group: 'K' },
  { id: 'NOR', name: 'Noruega', code: 'NOR', flagEmoji: '🇳🇴', group: 'K' },
  { id: 'ALG', name: 'Argelia', code: 'ALG', flagEmoji: '🇩🇿', group: 'K' },

  // Grupo L
  { id: 'TUR', name: 'Turquía', code: 'TUR', flagEmoji: '🇹🇷', group: 'L' },
  { id: 'VEN', name: 'Venezuela', code: 'VEN', flagEmoji: '🇻🇪', group: 'L' },
  { id: 'SCO', name: 'Escocia', code: 'SCO', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'L' },
  { id: 'PAN', name: 'Panamá', code: 'PAN', flagEmoji: '🇵🇦', group: 'L' }
];

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
