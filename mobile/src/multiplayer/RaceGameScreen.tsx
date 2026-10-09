import { useEffect, useMemo, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import type { RaceClock } from './raceClock';
import { Flag, preloadFlags } from '../components/Flag';
import { getCountryByCode, getCountryName } from '../data/countries';
import { useI18n } from '../i18n';
import { RACE_FLAGS_TOTAL, type RaceRoom } from './contract';
import { RaceWorldMap } from './RaceWorldMap';
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
  const total = round.plan?.length || RACE_FLAGS_TOTAL;
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
      <strong>{participant.progress}/{total}</strong>
    </header>
    <RaceWorldMap key={round.id} members={room.members} currentUserId={room.current_user_id}
      localProgress={participant.progress} localSequence={participant.expected_sequence} total={total} progress={progress} pending={pending} connected={connected} />
    <section className="race-question">
      <p>{text('question')}</p><Flag code={answer.code} name={getCountryName(answer, language)} size="hero" />
      {!connected && <p className="race-connection-warning" role="status"><WifiOff /> {text('unstable')}</p>}
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
