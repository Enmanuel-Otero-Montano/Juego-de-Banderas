// Browser-only test entry, excluded from the production entry graph.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/800.css';
import '../../src/styles.css';
import { I18nProvider } from '../../src/i18n';
import { RaceGameScreen } from '../../src/multiplayer/RaceGameScreen';
import { RaceClock } from '../../src/multiplayer/raceClock';
import type { RaceRoom } from '../../src/multiplayer/contract';

const epoch = Date.now();
const clock = new RaceClock(() => 10000);
for (let i = 0; i < 3; i++) clock.observe(0, 200, new Date(epoch + 100).toISOString(), new Date(epoch + 100).toISOString());
const names = ['Ana', 'Bruno', 'Cami', 'Diego', 'Elena', 'Fede', 'Gabi', 'Hugo'];
const members = names.map((display_name, i) => ({ user_id: i + 1, seat: i + 1, display_name, role: 'player' as const,
  ready: true, connected: true, intermission_state: 'in_lobby' as const }));
const base: RaceRoom = {
  id: 'fixture', code: 'ABC234', invite_url: '', status: 'round_active', scope: 'World', difficulty: 'normal',
  host_user_id: 1, current_user_id: 1, revision: 1, expires_at: '', members,
  current_round: { id: 'round', number: 1, status: 'running', starts_at: new Date(epoch).toISOString(),
    deadline_at: new Date(epoch + 90000).toISOString(), finished_at: null, finish_reason: null, winner_user_id: null,
    ruleset_version: 1, content_version: 1, participant: { progress: 6, mistakes: 0, expected_sequence: 7, discarded_codes: [], locked_until: null },
    plan: Array.from({ length: 12 }, () => ({ country_code: 'uy', option_codes: ['uy', 'ar', 'br', 'cl'] })) },
};
function Fixture() {
  const [config, setConfig] = useState({ count: 8, values: [6, 3, 0, 9, 12, 6, 3, 9], offline: false, pending: false });
  const room = { ...base, members: members.slice(0, config.count).map((member) => ({ ...member, connected: member.user_id !== 7 })),
    current_round: { ...base.current_round!, participant: { ...base.current_round!.participant!, progress: config.values[0], expected_sequence: config.values[0] + 1 } } };
  Object.assign(window, { raceFixture: { update: (value: Partial<typeof config>) => setConfig((old) => ({ ...old, ...value })) } });
  return <div className="app-shell"><RaceGameScreen key={config.count} room={room} clock={clock} connected={!config.offline} pending={config.pending}
    progress={Object.fromEntries(config.values.map((progress, i) => [i + 1, { progress, mistakes: 0 }]))}
    onAnswer={() => document.body.dataset.answered = 'true'} onExit={() => document.body.dataset.exited = 'true'} /></div>;
}
createRoot(document.getElementById('root')!).render(<I18nProvider><Fixture /></I18nProvider>);
