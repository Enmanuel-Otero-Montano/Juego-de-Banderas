import { useState } from 'react';
import { ArrowLeft, LogIn, Users } from 'lucide-react';
import { useI18n } from '../i18n';
import type { RaceDifficulty, RaceRoom, RaceScope } from './contract';
import { raceText } from './raceCopy';

const scopes: RaceScope[] = ['World', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
const difficulties: RaceDifficulty[] = ['easy', 'normal', 'hard'];

export function RaceCreateScreen({ authenticated, busy, error, onBack, onAccount, onCreate, onJoin }: {
  authenticated: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onAccount: () => void;
  onCreate: (input: { scope: RaceScope; difficulty: RaceDifficulty }) => Promise<RaceRoom>;
  onJoin: (code: string) => Promise<RaceRoom>;
}) {
  const { language } = useI18n();
  const text = (key: Parameters<typeof raceText>[1], values?: Record<string, string | number>) => raceText(language, key, values);
  const [scope, setScope] = useState<RaceScope>('World');
  const [difficulty, setDifficulty] = useState<RaceDifficulty>('normal');
  const [code, setCode] = useState('');

  return <main className="screen race-create-screen">
    <header className="race-heading">
      <button className="icon-button icon-button--light" onClick={onBack} aria-label={text('leave')}><ArrowLeft /></button>
      <div><p className="eyebrow">{text('private')}</p><h1>{text('createTitle')}</h1><p>{text('createDetail')}</p></div>
    </header>
    {!authenticated ? <section className="race-account-card">
      <span className="mode-card__icon"><LogIn /></span><h2>{text('account')}</h2><p>{text('accountDetail')}</p>
      <button className="primary-button" onClick={onAccount}>{text('login')}</button>
    </section> : <>
      <section className="race-setup-card">
        <label>{text('route')}<select value={scope} onChange={(event) => setScope(event.target.value as RaceScope)}>
          {scopes.map((value) => <option value={value} key={value}>{text(value)}</option>)}
        </select></label>
        <fieldset><legend>{text('difficulty')}</legend><div className="race-choice-row">
          {difficulties.map((value) => <button type="button" className={difficulty === value ? 'active' : ''} onClick={() => setDifficulty(value)} key={value}>{text(value)}</button>)}
        </div></fieldset>
        <button className="primary-button" disabled={busy} onClick={() => void onCreate({ scope, difficulty }).catch(() => undefined)}><Users /> {text('create')}</button>
      </section>
      <section className="race-join-card"><h2>{text('joinTitle')}</h2><div className="race-code-entry">
        <input aria-label={text('code')} placeholder={text('code')} value={code} maxLength={6} autoCapitalize="characters"
          onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} />
        <button className="secondary-button" disabled={busy || code.length !== 6} onClick={() => void onJoin(code).catch(() => undefined)}>{text('join')}</button>
      </div></section>
    </>}
    {error && <p className="race-error" role="alert">{error}</p>}
  </main>;
}
