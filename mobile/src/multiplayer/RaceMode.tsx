import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { preloadFlags } from '../components/Flag';
import { countries } from '../data/countries';
import { RaceClock } from './raceClock';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { shouldShowInterstitial, monetization } from '../services/monetization';
import { ApiError, type RankingSession } from '../services/api';
import type { RaceDifficulty, RaceRoom, RaceScope, RaceServerMessage } from './contract';
import { createRaceRoom, getRaceRoom, joinRaceRoom, leaveRaceRoom, startRaceRound, updateRaceRoom } from './raceApi';
import { connectRaceSocket, type RaceSocket } from './raceSocket';
import { initialRaceState, raceReducer } from './raceState';
import { RaceCreateScreen } from './RaceCreateScreen';
import { RaceLobbyScreen } from './RaceLobbyScreen';
import { RaceGameScreen } from './RaceGameScreen';
import { RaceResultsScreen } from './RaceResultsScreen';

const COUNTED_RESULTS_KEY = 'atlas-flags-counted-race-results-v1';
const activeRoomKey = (session: RankingSession) => `atlas-flags-active-race-room-v1:${session.userId || session.username}`;

const loadCountedResults = (): Set<string> => {
  try {
    const value = JSON.parse(localStorage.getItem(COUNTED_RESULTS_KEY) || '[]');
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(-50) : []);
  } catch { return new Set(); }
};

const saveCountedResults = (values: Set<string>) => {
  try { localStorage.setItem(COUNTED_RESULTS_KEY, JSON.stringify([...values].slice(-50))); } catch { /* Optional frequency persistence. */ }
};

const errorMessage = (error: unknown): string => error instanceof ApiError ? error.message : 'No pudimos conectar con la carrera.';

export function RaceMode({ session, isPremium, pendingInviteToken, onConsumeInvite, onBack, onAccount, onRoundCompleted }: {
  session: RankingSession | null;
  isPremium: boolean;
  pendingInviteToken: string | null;
  onConsumeInvite: () => void;
  onBack: () => void;
  onAccount: () => void;
  onRoundCompleted: (roundId: string) => number;
}) {
  const [state, dispatch] = useReducer(raceReducer, null, initialRaceState);
  const clock = useRef(new RaceClock()).current;
  const [appActive, setAppActive] = useState(document.visibilityState !== 'hidden');
  const [synchronized, setSynchronized] = useState(false);
  const [preparedScope, setPreparedScope] = useState<string | null>(null);
  const answerInFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [reconnectKey, setReconnectKey] = useState(0);
  const [completedSessions, setCompletedSessions] = useState<number | null>(null);
  const socketRef = useRef<RaceSocket | null>(null);
  const revisionRef = useRef(0);
  const reconnectTimer = useRef<number | undefined>(undefined);
  const countedResults = useRef(loadCountedResults());
  const joiningInvite = useRef(false);
  const restoringRoom = useRef(false);

  useEffect(() => {
    const scope = state.room?.scope;
    if (!scope) return;
    let active = true;
    setPreparedScope(null);
    void preloadFlags(countries.filter((country) => scope === 'World' || country.region === scope).map((country) => country.code))
      .then(() => { if (active) setPreparedScope(scope); })
      .catch(() => { if (active) dispatch({ type: 'error', message: 'No pudimos preparar las banderas. Vuelve a entrar a la sala.' }); });
    return () => { active = false; };
  }, [state.room?.scope]);

  useEffect(() => { if (!state.pendingEventId) answerInFlight.current = false; }, [state.pendingEventId]);

  useEffect(() => {
    const change = (active: boolean) => {
      clock.reset();
      setSynchronized(false);
      setAppActive(active);
      // Closing invalidates queued frames and re-estimates time after OS suspension.
      socketRef.current?.close();
      if (active) setReconnectKey((value) => value + 1);
    };
    const visibility = () => change(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', visibility);
    const listener = Capacitor.isNativePlatform()
      ? CapacitorApp.addListener('appStateChange', ({ isActive }) => change(isActive)) : null;
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      void listener?.then((handle) => handle.remove());
    };
  }, [clock]);

  const loadRoom = useCallback((room: RaceRoom) => {
    if (session) {
      try { localStorage.setItem(activeRoomKey(session), room.id); } catch { /* Rejoin can still use the invitation. */ }
    }
    dispatch({ type: 'message', message: { type: 'snapshot', protocol_version: 1, revision: room.revision, room } });
  }, [session]);

  useEffect(() => { revisionRef.current = state.revision; }, [state.revision]);

  const completeVisibleRound = useCallback((room: RaceRoom | null) => {
    const round = room?.current_round;
    if (!round || !['finished', 'expired'].includes(round.status) || round.participant?.session_eligible === false || countedResults.current.has(round.id)) return;
    countedResults.current.add(round.id);
    saveCountedResults(countedResults.current);
    const nextCount = onRoundCompleted(round.id);
    setCompletedSessions(nextCount);
    void monetization.preloadInterstitial(nextCount, isPremium);
  }, [isPremium, onRoundCompleted]);

  useEffect(() => { completeVisibleRound(state.room); }, [completeVisibleRound, state.room]);

  useEffect(() => {
    if (!session || !pendingInviteToken || state.room || joiningInvite.current) return;
    joiningInvite.current = true;
    setBusy(true);
    void joinRaceRoom(session, { token: pendingInviteToken }).then((room) => {
      loadRoom(room);
      onConsumeInvite();
    }).catch((error) => dispatch({ type: 'error', message: errorMessage(error) }))
      .finally(() => { setBusy(false); joiningInvite.current = false; });
  }, [loadRoom, onConsumeInvite, pendingInviteToken, session, state.room]);

  useEffect(() => {
    if (!session || pendingInviteToken || state.room || restoringRoom.current) return;
    let roomId: string | null = null;
    try { roomId = localStorage.getItem(activeRoomKey(session)); } catch { /* No saved room. */ }
    if (!roomId) return;
    restoringRoom.current = true;
    setBusy(true);
    void getRaceRoom(session, roomId).then(loadRoom).catch(() => {
      try { localStorage.removeItem(activeRoomKey(session)); } catch { /* No-op. */ }
    }).finally(() => { restoringRoom.current = false; setBusy(false); });
  }, [loadRoom, pendingInviteToken, session, state.room]);

  useEffect(() => {
    if (!session || !state.room?.id) return;
    if (!appActive) return;
    let active = true;
    setSynchronized(false);
    const socket = connectRaceSocket(session, state.room.id, {
      clock,
      onClockChange: () => { if (active) setSynchronized(clock.ready); },
      onConnectionChange: (connected) => {
        if (!active) return;
        dispatch({ type: 'connection', connected });
        if (!connected) {
          window.clearTimeout(reconnectTimer.current);
          reconnectTimer.current = window.setTimeout(() => setReconnectKey((value) => value + 1), 1_500);
        }
      },
      onMessage: (message: RaceServerMessage) => {
        if (!active) return;
        if (message.revision > revisionRef.current + 1) socketRef.current?.requestSnapshot();
        dispatch({ type: 'message', message });
        if (message.type === 'error') socketRef.current?.requestSnapshot();
      },
    });
    socketRef.current = socket;
    return () => {
      active = false;
      window.clearTimeout(reconnectTimer.current);
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
    // A reconnect deliberately rebuilds the transport while preserving reducer state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appActive, reconnectKey, session, state.room?.id]);

  const create = async (input: { scope: RaceScope; difficulty: RaceDifficulty }) => {
    if (!session) throw new Error('Authentication required');
    setBusy(true);
    try { const room = await createRaceRoom(session, input); loadRoom(room); return room; }
    catch (error) { dispatch({ type: 'error', message: errorMessage(error) }); throw error; }
    finally { setBusy(false); }
  };
  const join = async (code: string) => {
    if (!session) throw new Error('Authentication required');
    setBusy(true);
    try { const room = await joinRaceRoom(session, { code }); loadRoom(room); return room; }
    catch (error) { dispatch({ type: 'error', message: errorMessage(error) }); throw error; }
    finally { setBusy(false); }
  };
  const update = async (input: { scope?: RaceScope; difficulty?: RaceDifficulty }) => {
    if (!session || !state.room) return;
    setBusy(true);
    try { loadRoom(await updateRaceRoom(session, state.room.id, input)); }
    catch (error) { dispatch({ type: 'error', message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const start = async () => {
    if (!session || !state.room) return;
    setBusy(true);
    try { dispatch({ type: 'round_started', round: await startRaceRound(session, state.room.id, state.revision) }); }
    catch (error) { dispatch({ type: 'error', message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const leave = async () => {
    if (session && state.room?.status === 'waiting') {
      try { await leaveRaceRoom(session, state.room.id); } catch { /* Leaving the local screen still succeeds. */ }
      try { localStorage.removeItem(activeRoomKey(session)); } catch { /* No-op. */ }
    }
    socketRef.current?.close();
    onBack();
  };
  const answer = (selectedCode: string, correct: boolean) => {
    const current = state.room?.current_round;
    const now = clock.now();
    const participant = current?.participant;
    const question = state.room?.current_round?.plan?.[participant?.progress || 0];
    if (!current || !participant || !question || state.pendingEventId || answerInFlight.current || !state.connected ||
      !clock.ready || now < Date.parse(current.starts_at) || now >= Date.parse(current.deadline_at) ||
      !['countdown', 'running'].includes(current.status) || participant.progress >= (current.plan?.length || 12) ||
      (participant.locked_until && now < Date.parse(participant.locked_until))) return;
    answerInFlight.current = true;
    const eventId = crypto.randomUUID();
    dispatch({ type: 'answer_sent', eventId, selectedCode, correct });
    socketRef.current?.sendAnswer({
      roundId: current.id,
      eventId,
      sequence: participant.expected_sequence,
      countryCode: question.country_code,
      selectedCode,
    });
  };
  const continueToLobby = async () => {
    const roundId = state.room?.current_round?.id;
    if (!roundId) return;
    const eligible = completedSessions !== null && shouldShowInterstitial(completedSessions, isPremium);
    if (eligible) {
      socketRef.current?.sendIntermission('ad_break');
      await monetization.showPreloadedInterstitial();
    }
    socketRef.current?.sendIntermission('in_lobby');
    dispatch({ type: 'dismiss_result', roundId });
  };

  const round = state.room?.current_round;
  const showingResult = Boolean(round && ['finished', 'expired'].includes(round.status) && state.dismissedResultId !== round.id);
  const racing = Boolean(round && ['countdown', 'running'].includes(round.status));
  if (!state.room) return <RaceCreateScreen authenticated={Boolean(session)} busy={busy} error={state.error} onBack={onBack} onAccount={onAccount} onCreate={create} onJoin={join} />;
  if (showingResult) return <RaceResultsScreen room={state.room} onContinue={() => void continueToLobby()} />;
  if (racing) return <RaceGameScreen clock={clock} room={state.room} connected={state.connected} pending={Boolean(state.pendingEventId)} progress={state.progress} onAnswer={answer} onExit={() => void leave()} />;
  return <RaceLobbyScreen prepared={synchronized && preparedScope === state.room.scope} error={state.error} room={state.room} connected={state.connected} busy={busy} onReady={(ready) => { if (!ready || (clock.ready && preparedScope === state.room?.scope)) socketRef.current?.sendReady(ready); }} onStart={() => void start()} onUpdate={(input) => void update(input)} onLeave={() => void leave()} />;
}
