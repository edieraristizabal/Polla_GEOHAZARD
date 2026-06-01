import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Participant } from '../types';
import { AVATAR_OPTIONS } from '../data/avatars';

interface HeaderProps {
  activeParticipant: Participant | null;
  participants: Participant[];
  onSelectParticipant: (id: string | null) => void;
}

export function Header({
  activeParticipant,
  participants,
  onSelectParticipant
}: HeaderProps) {
  const getAvatarEmoji = (avatarId: string) => {
    const found = AVATAR_OPTIONS.find((a) => a.id === avatarId);
    return found ? found.emoji : '👤';
  };

  return (
    <header className="relative border-b border-slate-800 bg-bg-card text-slate-100 select-none">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary rounded-sm rotate-45 flex items-center justify-center shrink-0 shadow-md shadow-brand-primary/10">
            <div className="w-5 h-5 bg-[#0A0C10] -rotate-45 flex items-center justify-center">
              <ShieldAlert size={12} className="text-brand-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white flex items-baseline leading-none">
              GEOHAZARD
              <span className="text-brand-primary text-[10px] font-mono tracking-widest ml-2 font-bold uppercase">
                WORLD CUP 2026
              </span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono mt-1">
              Polla Deportiva Mundialista
            </p>
          </div>
        </div>

        {/* Participant Switcher / Session */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest block text-slate-500">Participante</span>
            <span className="text-sm font-bold text-white block leading-tight">
              {activeParticipant ? activeParticipant.name : 'Espectador'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                aria-label="Seleccionar participante"
                value={activeParticipant?.id || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectParticipant(val === '' ? null : val);
                }}
                className="block w-48 rounded-sm border border-slate-800 bg-[#0A0C10] px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono cursor-pointer transition"
              >
                <option value="">-- Modo Espectador --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getAvatarEmoji(p.avatarUrl)} {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
