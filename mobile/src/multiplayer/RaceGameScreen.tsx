import { useEffect, useMemo, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import type { RaceClock } from './raceClock';
import { Flag, preloadFlags } from '../components/Flag';
import { getCountryByCode, getCountryName } from '../data/countries';
import { useI18n } from '../i18n';
import type { RaceRoom } from './contract';
import { raceText } from './raceCopy';

export function RaceGameScreen({ room, clock, connected, pending, progress, onAnswer, onExit }: {
  room: RaceRoom;
  clock: RaceClock;
  connected: boolean;
  pending: boolean;
  progress: Record<number, { progress: number; mistakes: number }>;
  onAnswer: (selectedCode: string, correct: boolean) => void;
  onExit: () => void;
}) {
  const { language } = useI18n();
  const text = (key: Parameters<typeof raceText>[1], values?: Record<string, string | number>) => raceText(language, key, values);
  const round = room.current_round!;
  const participant = round.participant!;
  const [now, setNow] = useState(() => clock.now());
  const [preparedRound, setPreparedRound] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void preloadFlags((round.plan || []).map((question) => question.country_code))
      .then(() => { if (active) setPreparedRound(round.id); }).catch(() => { /* Keep answers blocked; rejoining retries. */ });
    return () => { active = false; };
  }, [round.id, round.plan]);
  useEffect(() => {
    let frame: number;
    const tick = () => { setNow(clock.now()); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock]);
  const startsIn = Math.max(0, new Date(round.starts_at).getTime() - now);
  const secondsLeft = Math.max(0, Math.ceil((new Date(round.deadline_at).getTime() - now) / 1000));
  const locked = Boolean(participant.locked_until && new Date(participant.locked_until).getTime() > now);
  const question = round.plan?.[Math.min(participant.progress, (round.plan?.length || 1) - 1)];
  const answer = question ? getCountryByCode(question.country_code) : undefined;
  const optionCountries = useMemo(() => question?.option_codes.map(getCountryByCode).filter(Boolean) || [], [question]);

  const preparing = !Number.isFinite(now) || preparedRound !== round.id;
  const blocked = preparing || startsIn > 0;
  const completed = participant.progress >= (round.plan?.length || 12);
  if (!question || !answer) return <main className="race-game-screen"><p>{text('error')}</p></main>;

  return <>
    {blocked && <main className="race-game-screen race-countdown-screen">
      <button className="icon-button icon-button--light" onClick={onExit} aria-label={text('leave')}><X /></button>
      <p className="eyebrow">{text(preparing ? 'notReady' : 'countdown')}</p>
      <strong>{preparing ? '…' : Math.max(1, Math.ceil(startsIn / 1000))}</strong>
      {!connected && <p>{text('unstable')}</p>}
    </main>}
    <main className="race-game-screen" aria-hidden={blocked} style={blocked ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' } : undefined}>
    <header className="race-game-header">
      <button className="icon-button icon-button--light" onClick={onExit} aria-label={text('leave')}><X /></button>
      <div className="race-timer" aria-label={text('time')}>{Number.isFinite(secondsLeft) ? `${secondsLeft}s` : '…'}</div>
      <strong>{text('progress', { current: participant.progress })}</strong>
    </header>
    <section className="race-progress-track" aria-label={text('progress', { current: participant.progress })}>
      {room.members.map((member) => {
        const value = member.user_id === room.current_user_id ? participant.progress : (progress[member.user_id]?.progress || 0);
        return <div className="race-progress-player" style={{ '--race-progress': `${(value / 12) * 100}%` } as React.CSSProperties} key={member.user_id}>
          <span>{member.display_name.slice(0, 1).toUpperCase()}</span><small>{value}/12</small>
        </div>;
      })}
    </section>
    {!connected && <p className="race-connection-warning"><WifiOff /> {text('unstable')}</p>}
    <section className="race-question">
      <p>{text('question')}</p><Flag code={answer.code} name={getCountryName(answer, language)} size="hero" />
    </section>
    <div className="race-answer-grid">
      {optionCountries.map((country) => {
        if (!country) return null;
        const discarded = participant.discarded_codes.includes(country.code);
        return <button key={country.code} disabled={blocked || !connected || pending || locked || discarded || completed || secondsLeft === 0}
          className={discarded ? 'race-answer race-answer--discarded' : 'race-answer'}
          onClick={() => onAnswer(country.code, country.code === question.country_code)}>{getCountryName(country, language)}</button>;
      })}
    </div>
    {locked && <p className="race-penalty" role="status">+1.5s</p>}
  </main></>;
}
