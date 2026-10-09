import { ArrowLeft, Check, Crown, Share2, WifiOff } from 'lucide-react';
import { Share } from '@capacitor/share';
import { useI18n } from '../i18n';
import type { RaceDifficulty, RaceIntermissionState, RaceRoom, RaceScope } from './contract';
import { raceText } from './raceCopy';
import { apiBaseUrl } from '../services/api';

const statusKey = (member: RaceRoom['members'][number]): 'disconnected' | 'ready' | 'reviewing' | 'break' | 'connected' | 'notReady' => {
  if (!member.connected) return 'disconnected';
  if (member.ready) return 'ready';
  if (member.intermission_state === 'reviewing_result') return 'reviewing';
  if (member.intermission_state === 'ad_break') return 'break';
  return member.intermission_state === 'in_lobby' ? 'connected' : 'notReady';
};

export function RaceLobbyScreen({ room, connected, prepared, error, busy, onReady, onStart, onUpdate, onLeave }: {
  room: RaceRoom;
  prepared: boolean;
  error: string | null;
  connected: boolean;
  busy: boolean;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onUpdate: (input: { scope?: RaceScope; difficulty?: RaceDifficulty }) => void;
  onLeave: () => void;
}) {
  const { language } = useI18n();
  const text = (key: Parameters<typeof raceText>[1], values?: Record<string, string | number>) => raceText(language, key, values);
  const me = room.members.find((member) => member.user_id === room.current_user_id);
  const isHost = room.host_user_id === room.current_user_id;
  const waiting = room.members.filter((member) => !member.ready).length;
  const canStart = connected && prepared && room.members.length >= 2 && room.members.every((member) => member.connected && member.ready);
  const share = async () => {
    const title = text('mode');
    const message = `${title}\n${room.code}\n${room.invite_url}`;
    try { await Share.share({ title, text: message, url: room.invite_url, dialogTitle: text('share') }); }
    catch { await navigator.clipboard?.writeText(message); }
  };

  return <main className="screen race-lobby-screen">
    <header className="race-heading"><button className="icon-button icon-button--light" onClick={onLeave} aria-label={text('leave')}><ArrowLeft /></button>
      <div><p className="eyebrow">{text('private')}</p><h1>{text('lobby')}</h1><p>{text(room.scope)} · {text(room.difficulty)}</p></div>
    </header>
    <section className="race-invite-card"><div><small>{text('code')}</small><strong>{room.code}</strong></div>
      <button className="secondary-button" onClick={() => void share()}><Share2 /> {text('share')}</button></section>
    {isHost && <section className="race-host-settings">
      <label>{text('route')}<select value={room.scope} disabled={busy} onChange={(event) => onUpdate({ scope: event.target.value as RaceScope })}>
        {(['World', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'] as RaceScope[]).map((value) => <option value={value} key={value}>{text(value)}</option>)}
      </select></label>
      <label>{text('difficulty')}<select value={room.difficulty} disabled={busy} onChange={(event) => onUpdate({ difficulty: event.target.value as RaceDifficulty })}>
        {(['easy', 'normal', 'hard'] as RaceDifficulty[]).map((value) => <option value={value} key={value}>{text(value)}</option>)}
      </select></label>
    </section>}
    <section className="race-roster" aria-live="polite">
      {room.members.map((member) => {
        const key = statusKey(member);
        return <article className={`race-player race-player--${key}`} key={member.user_id}>
          {member.avatar_url ? <img className="race-player__avatar" src={`${apiBaseUrl}${member.avatar_url}`} alt={member.display_name} /> : <span className="race-player__avatar">{member.display_name.slice(0, 1).toUpperCase()}</span>}
          <span><strong>{member.display_name} {member.user_id === room.current_user_id && <small>({text('you')})</small>}</strong>
            <small>{key === 'disconnected' && <WifiOff size={13} />} {text(key)}</small></span>
          {member.role === 'host' ? <Crown aria-label={text('host')} /> : member.ready ? <Check /> : null}
        </article>;
      })}
      {Array.from({ length: Math.max(0, 2 - room.members.length) }, (_, index) => <article className="race-player race-player--empty" key={`empty-${index}`}>…</article>)}
    </section>
    {waiting > 0 && <p className="race-waiting">{text(waiting === 1 ? 'waitingOne' : 'waitingMany', { count: waiting })}</p>}
    {!connected && <p className="race-connection-warning"><WifiOff /> {text('unstable')}</p>}
    {error && <p role="alert">{error}</p>}
    {!prepared && <p role="status">{text('notReady')}…</p>}
    <div className="race-lobby-actions">
      <button className={me?.ready ? 'secondary-button' : 'primary-button'} disabled={!connected || !prepared} onClick={() => onReady(!me?.ready)}>
        {me?.ready ? text('notReady') : text('ready')}
      </button>
      {isHost && <button className="primary-button" disabled={!canStart || busy} onClick={onStart}>{text('start')}</button>}
    </div>
  </main>;
}

export const intermissionStateForAd = (eligible: boolean): RaceIntermissionState => eligible ? 'ad_break' : 'in_lobby';
