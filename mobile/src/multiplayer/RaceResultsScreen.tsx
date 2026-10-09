import { Share2, Trophy } from 'lucide-react';
import { Share } from '@capacitor/share';
import { useI18n } from '../i18n';
import type { RaceRoom } from './contract';
import { raceText } from './raceCopy';
import { apiBaseUrl } from '../services/api';

export function RaceResultsScreen({ room, onContinue }: { room: RaceRoom; onContinue: () => void }) {
  const { language } = useI18n();
  const text = (key: Parameters<typeof raceText>[1], values?: Record<string, string | number>) => raceText(language, key, values);
  const round = room.current_round!;
  const standings = round.standings || [];
  const winner = standings.find((item) => item.user_id === round.winner_user_id) || standings[0];
  const share = async () => {
    const lines = standings.map((item) => `${item.rank}. ${item.display_name} · ${item.progress}/12`).join('\n');
    try { await Share.share({ title: text('result'), text: `${text('mode')}\n${lines}` }); } catch { /* Dismissed share sheet. */ }
  };
  return <main className="screen race-results-screen">
    <section className="race-result-hero"><Trophy /><p className="eyebrow">{round.finish_reason === 'completed' ? text('completed') : text('timeout')}</p>
      <h1>{winner?.display_name || text('result')}</h1><p>{text('winner')}</p></section>
    <section className="race-standings">
      {standings.map((standing) => <article className={standing.user_id === room.current_user_id ? 'race-standing race-standing--me' : 'race-standing'} key={standing.user_id}>
        <strong>{standing.rank}</strong>{standing.avatar_url ? <img className="race-standing__avatar" src={`${apiBaseUrl}${standing.avatar_url}`} alt={standing.display_name} /> : <span className="race-standing__avatar">{standing.display_name.slice(0, 1).toUpperCase()}</span>}<span>{standing.display_name}{standing.user_id === room.current_user_id ? ` · ${text('you')}` : ''}</span>
        <span>{standing.progress}/12<small>{text('mistakes', { count: standing.mistakes })}</small></span>
      </article>)}
    </section>
    <div className="race-result-actions"><button className="secondary-button" onClick={() => void share()}><Share2 /> {text('shareResult')}</button>
      <button className="primary-button" onClick={onContinue}>{text('rematch')}</button></div>
  </main>;
}
