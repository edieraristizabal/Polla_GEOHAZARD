import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertOctagon, HelpCircle, UserCheck } from 'lucide-react';
import { Participant, Match } from '../types';
import { AVATAR_OPTIONS } from '../data/avatars';

interface UserProfileProps {
  activeParticipant: Participant | null;
  participants: Participant[];
  matches: Match[];
  onRegisterParticipant: (name: string, email: string, avatarId: string) => void;
  onSelectParticipant: (id: string | null) => void;
}

export function UserProfile({
  activeParticipant,
  participants,
  matches,
  onRegisterParticipant,
  onSelectParticipant
}: UserProfileProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('av_1');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, ingresa tu nombre o apodo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // Check if email already registered
    const formattedEmail = email.trim().toLowerCase();
    const existing = participants.find((p) => p.email.toLowerCase() === formattedEmail);

    if (existing) {
      if (formattedEmail === 'edieraristizabal@gmail.com') {
        const code = prompt('Ingrese la contraseña de administrador para iniciar sesión:');
        if (code !== 'geohazard2026') {
          setErrorMessage('Contraseña de administrador incorrecta.');
          return;
        }
      }
      // Log them in
      onSelectParticipant(existing.id);
      setName('');
      setEmail('');
      return;
    }

    if (formattedEmail === 'edieraristizabal@gmail.com') {
      const code = prompt('Ingrese la contraseña de administrador para registrar este correo:');
      if (code !== 'geohazard2026') {
        setErrorMessage('Contraseña de administrador incorrecta.');
        return;
      }
    }

    // Register
    onRegisterParticipant(name.trim(), formattedEmail, selectedAvatarId);
    setName('');
    setEmail('');
  };

  const handleResendRequest = () => {
    if (!activeParticipant) return;
    const pName = activeParticipant.name;
    const pEmail = activeParticipant.email;
    const pAvatar = activeParticipant.avatarUrl;
    
    const subject = encodeURIComponent(`Inscripción Polla Geohazard: ${pName}`);
    const approveUrl = `https://edieraristizabal.github.io/Polla_GEOHAZARD/?approve_name=${encodeURIComponent(pName)}&approve_email=${encodeURIComponent(pEmail)}&approve_avatar=${encodeURIComponent(pAvatar)}`;
    const body = encodeURIComponent(`Hola Edier,\n\nQuiero registrarme en la Polla Geohazard.\nNombre: ${pName}\nCorreo: ${pEmail}\nAvatar: ${pAvatar}\n\nPor favor aprueba mi inscripción haciendo clic en el siguiente enlace:\n${approveUrl}`);
    
    window.open(`mailto:edieraristizabal@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSendPredictionsMail = () => {
    if (!activeParticipant) return;
    
    const exportData = {
      id: activeParticipant.id,
      name: activeParticipant.name,
      email: activeParticipant.email,
      avatarUrl: activeParticipant.avatarUrl,
      predictions: activeParticipant.predictions,
      isCompleted: activeParticipant.isCompleted
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    
    navigator.clipboard.writeText(jsonStr)
      .then(() => {
        const predStr = JSON.stringify(activeParticipant.predictions);
        const base64Str = btoa(unescape(encodeURIComponent(predStr)));
        const subject = encodeURIComponent(`Pronósticos Polla Geohazard: ${activeParticipant.name}`);
        const importUrl = `https://edieraristizabal.github.io/Polla_GEOHAZARD/?import_predictions=true&email=${encodeURIComponent(activeParticipant.email)}&data=${encodeURIComponent(base64Str)}`;
        const body = encodeURIComponent(`Hola Edier, aquí están mis pronósticos de la Polla Geohazard.\n\nPara importarlos y guardarlos automáticamente en la aplicación, haz clic en el siguiente enlace:\n${importUrl}\n\nPor si el enlace anterior no funciona, aquí está el JSON de mi cartilla (que ya se copió a tu portapapeles):\n\n${jsonStr}`);
        
        window.open(`mailto:edieraristizabal@gmail.com?subject=${subject}&body=${body}`, '_blank');
      })
      .catch((e) => {
        alert("Error al preparar el envío. Por favor copia los datos manualmente.");
        console.error(e);
      });
  };

  // Check how many matches the active user has predicted out of total matches
  const getPredictionStats = () => {
    if (!activeParticipant) return { predicted: 0, total: 0, percent: 0, isDone: false };

    const total = matches.length;
    let predicted = 0;

    matches.forEach((m) => {
      const pred = activeParticipant.predictions[m.id];
      if (pred && pred.homeScore !== null && pred.awayScore !== null) {
        predicted += 1;
      }
    });

    return {
      predicted,
      total,
      percent: Math.round((predicted / total) * 100),
      isDone: predicted === total
    };
  };

  const currentPredStats = getPredictionStats();

  return (
    <div className="bg-bg-card border border-slate-800 rounded-sm p-5 shadow-lg h-full">
      <div className="border-b border-slate-850 pb-3 mb-4">
        <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          {activeParticipant ? (
            <>
              <UserCheck className="text-brand-primary" size={16} />
              Tu Perfil de Competidor
            </>
          ) : (
            <>
              <UserPlus className="text-brand-cyan" size={16} />
              Inscribirse en Geohazard
            </>
          )}
        </h3>
      </div>

      {activeParticipant ? (
        <div className="space-y-4">
          {/* Active Profile Info Card */}
          <div className="bg-[#0A0C10] border border-slate-800 rounded-sm p-4 flex items-center gap-4">
            <span className="w-12 h-12 rounded-sm shrink-0 flex items-center justify-center text-2xl bg-slate-900 border border-slate-800 shadow">
              {AVATAR_OPTIONS.find((a) => a.id === activeParticipant.avatarUrl)?.emoji || '👤'}
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-white block text-sm truncate uppercase tracking-tight">
                {activeParticipant.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
                {activeParticipant.email}
              </span>
              {activeParticipant.status === 'pending' ? (
                <span className="text-[10px] text-amber-500 font-mono block mt-1.5 uppercase font-black">
                  ⏳ PENDIENTE DE APROBACIÓN
                </span>
              ) : (
                <span className="text-[10px] text-brand-primary font-mono block mt-1.5 uppercase font-black">
                  PUNTAJE ACTUAL: {activeParticipant.points} PTS
                </span>
              )}
            </div>
          </div>

          {/* Subscriptions checklists checklist */}
          <div className="bg-[#0A0C10] p-3.5 rounded-sm border border-slate-850">
            <span className="text-[9px] uppercase font-mono font-black tracking-widest text-slate-500 block mb-1.5">
              ESTADO DE TU CARTILLA
            </span>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 font-sans">
                Partidos completados:
              </span>
              <span className="text-xs font-mono font-black text-brand-primary">
                {currentPredStats.predicted} / {currentPredStats.total} ({currentPredStats.percent}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-900 overflow-hidden mb-3 rounded-none">
              <div
                className="h-full bg-brand-primary transition-all duration-300"
                style={{ width: `${currentPredStats.percent}%` }}
              />
            </div>

            {activeParticipant.status === 'pending' ? (
              <div className="bg-amber-950/15 border border-amber-900/50 text-amber-400 p-3 rounded-sm text-xs space-y-2">
                <div className="flex gap-2 font-bold uppercase tracking-wide text-[10px] items-center">
                  <AlertOctagon size={14} className="shrink-0" />
                  <span>Inscripción Pendiente</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Tu perfil se ha creado localmente, pero el administrador (Edier) debe autorizarte para que tus puntajes y pronósticos aparezcan en la tabla general.
                </p>
                <button
                  type="button"
                  onClick={handleResendRequest}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-mono font-black text-[9px] py-1.5 uppercase rounded-sm transition cursor-pointer text-center"
                >
                  ✉️ Enviar correo de solicitud
                </button>
              </div>
            ) : currentPredStats.isDone ? (
              <div className="bg-emerald-950/10 border border-emerald-950 text-brand-primary p-2.5 rounded-sm text-xs flex gap-2">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wide text-[10px]">¡Tu cartilla está lista!</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                    Has completado todos los pronósticos del mundial. Puedes ajustar resultados hasta 5 minutos antes del inicio de cada partido.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-950/10 border border-amber-900/30 text-amber-500 p-2.5 rounded-sm text-xs flex gap-2 animate-[pulse_5s_infinite]">
                <AlertOctagon size={14} className="shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="font-bold uppercase tracking-wide text-[10px]">Cartilla Incompleta</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                    ¡Atención! Si no completas todos los pronósticos antes del pitazo inicial del mundial, el reglamento de Geohazard asignará resultados aleatorios automáticamente.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSendPredictionsMail}
            className="w-full mb-2 py-2 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 border border-[#F59E0B]/30 rounded-sm text-[10px] text-[#F59E0B] hover:text-white transition-colors font-mono uppercase font-black tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            ✉️ Enviar Pronósticos a Edier (Email)
          </button>

          <button
            type="button"
            onClick={() => {
              const exportData = {
                id: activeParticipant.id,
                name: activeParticipant.name,
                email: activeParticipant.email,
                avatarUrl: activeParticipant.avatarUrl,
                predictions: activeParticipant.predictions,
                isCompleted: activeParticipant.isCompleted
              };
              navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
                .then(() => alert("📋 ¡Cartilla copiada al portapapeles! Envíasela al administrador."))
                .catch(() => alert("Error al copiar. Por favor copia los datos manualmente."));
            }}
            className="w-full mb-2 py-2 bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/30 rounded-sm text-[10px] text-brand-primary hover:text-white transition-colors font-mono uppercase font-black tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            📤 Exportar Mi Cartilla (Copiar JSON)
          </button>

          <button
            onClick={() => onSelectParticipant(null)}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-sm text-[10px] text-slate-400 hover:text-white transition-colors font-mono uppercase font-black tracking-wider cursor-pointer"
          >
            Ver Modo Espectador
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-950/20 border border-red-900/20 p-2.5 rounded-sm text-xs text-rose-400 font-mono text-center">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="user-name" className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 font-mono">Nombre / Apodo</label>
            <input
              id="user-name"
              type="text"
              placeholder="Ej: Andres_Striker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A0C10] border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand-primary transition font-sans"
            />
          </div>

          <div>
            <label htmlFor="user-email" className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 font-mono">Correo Electrónico</label>
            <input
              id="user-email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0C10] border border-slate-800 rounded-sm px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand-primary transition font-sans"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-1.5 block leading-normal">
              💡 Si ya tienes una cuenta registrada, escribe tu correo para cargarla de inmediato.
            </span>
          </div>

          {/* Avatar selector bar */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 font-mono">Selecciona tu Avatar</label>
            <div className="grid grid-cols-5 gap-1.5">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(av.id)}
                  title={av.name}
                  className={`p-2 rounded-sm text-lg flex items-center justify-center transition border cursor-pointer ${
                    selectedAvatarId === av.id
                      ? 'bg-brand-primary/25 border-brand-primary scale-105 shadow'
                      : 'bg-black border-slate-850 opacity-60 hover:opacity-100 hover:border-slate-800'
                  }`}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1.5 block text-center uppercase tracking-wider">
              Selección:{' '}
              <span className="text-brand-primary font-bold">
                {AVATAR_OPTIONS.find((x) => x.id === selectedAvatarId)?.name}
              </span>
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-brand-primary hover:bg-emerald-600 text-black font-black font-mono text-xs rounded-sm transition duration-150 uppercase tracking-widest cursor-pointer shadow-md shadow-brand-primary/10"
          >
            Inscribirse & Comenzar
          </button>
        </form>
      )}
    </div>
  );
}
