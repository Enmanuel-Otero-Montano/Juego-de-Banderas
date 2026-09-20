import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  Flame,
  Flag as FlagIcon,
  Gamepad2,
  Gift,
  Globe2,
  Heart,
  Home,
  Lightbulb,
  Lock,
  Map,
  MapPin,
  Plane,
  RotateCcw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { Flag } from './components/Flag';
import { countries, formatPopulation, getCapitalName, getCountryName, getRegionCountries } from './data/countries';
import { getExpeditionPool, getHomeStageId, getJourneyExpeditionCountries, getJourneyRoute, getJourneyStagePool, getJourneyStageText, getNextRouteChoices, journeyStages } from './data/journey';
import { buildQuestions, completeSession, hiddenOptionCodes, isoDate, shuffle } from './game';
import { languageOptions, useI18n } from './i18n';
import { monetization } from './services/monetization';
import { chooseDifficultyCountries, difficultyRules } from './rules';
import { initialProfile, loadProfile, saveProfile } from './storage';
import {
  ApiError,
  beginCareerAttempt,
  clearRankingSession,
  deleteRankingAccount,
  getLeaderboard,
  loadRankingSession,
  loginRankingAccount,
  registerRankingAccount,
  resendVerificationEmail,
  submitCareerStage,
  updateRankingProfile,
  type LeaderboardEntry,
  type RankingSession,
} from './services/api';
import type {
  AnswerRecord,
  Country,
  Difficulty,
  GameConfig,
  PlayerProfile,
  Question,
  RegionKey,
  SessionReward,
} from './types';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

type Screen = 'home' | 'regions' | 'career' | 'origin' | 'onboarding' | 'progress' | 'store' | 'settings' | 'privacy' | 'leaderboard' | 'account' | 'game';
type RankingStatus = 'publishing' | 'published' | 'not-qualified' | 'offline' | 'error';
type GameResult = { reward: SessionReward; records: AnswerRecord[]; config: GameConfig; rankingStatus?: RankingStatus };

const regions: RegionKey[] = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
const today = isoDate();

const playFeedback = (success: boolean, soundEnabled: boolean, hapticsEnabled: boolean) => {
  if (hapticsEnabled && Capacitor.isNativePlatform()) {
    Haptics.notification({ type: success ? NotificationType.Success : NotificationType.Error }).catch(() => undefined);
  }
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = success ? 620 : 190;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  } catch {
    // Audio feedback is optional.
  }
};

function TopBar({ profile, onStore, onSettings, onLeaderboard }: { profile: PlayerProfile; onStore: () => void; onSettings: () => void; onLeaderboard: () => void }) {
  const { t } = useI18n();
  return (
    <header className="topbar">
      <div className="brand-mark" aria-label={t('app.name')}><Globe2 size={22} /></div>
      <div className="topbar__stats">
        <span className="stat-pill stat-pill--streak"><Flame size={16} /> {profile.streak}</span>
        <button className="stat-pill" onClick={onStore} aria-label={t('top.store')}><CircleDollarSign size={16} /> {profile.coins}</button>
        <button className="icon-button" onClick={onLeaderboard} aria-label={t('top.rankings')}><Trophy size={18} /></button>
        <button className="icon-button" onClick={onSettings} aria-label={t('top.settings')}><Settings size={19} /></button>
      </div>
    </header>
  );
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const { t } = useI18n();
  return (
    <nav className="bottom-nav" aria-label={t('nav.label')}>
      <button className={screen === 'home' ? 'active' : ''} onClick={() => setScreen('home')}><Home /><span>{t('nav.home')}</span></button>
      <button className={screen === 'career' || screen === 'regions' ? 'active' : ''} onClick={() => setScreen('career')}><Map /><span>{t('nav.journey')}</span></button>
      <button className={screen === 'progress' ? 'active' : ''} onClick={() => setScreen('progress')}><BarChart3 /><span>{t('nav.progress')}</span></button>
    </nav>
  );
}

function SectionHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="section-header">
      <button className="icon-button icon-button--light" onClick={onBack} aria-label={t('common.back')}><ArrowLeft /></button>
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    </div>
  );
}

function HomeScreen({ profile, startGame, setScreen }: {
  profile: PlayerProfile;
  startGame: (config: GameConfig) => void;
  setScreen: (screen: Screen) => void;
}) {
  const { t } = useI18n();
  const dailyDone = Boolean(profile.dailyResults[today]);
  const level = Math.floor(profile.xp / 250) + 1;
  const levelProgress = profile.xp % 250;

  return (
    <main className="screen home-screen">
      <section className="welcome-row">
        <div><p className="eyebrow">{t('home.level', { level })}</p><h1>{t('home.title')}</h1></div>
        <div className="level-ring" style={{ '--progress': `${(levelProgress / 250) * 360}deg` } as React.CSSProperties}><span>{level}</span></div>
      </section>

      <button
        className={`daily-card ${dailyDone ? 'daily-card--done' : ''}`}
        onClick={() => startGame({ mode: 'daily', title: t('home.dailyTitle'), subtitle: t('home.dailySubtitle'), pool: countries, questionCount: 7, seed: today })}
      >
        <div className="daily-card__copy">
          <span className="daily-card__tag">{dailyDone ? <><Check size={14} /> {t('home.completed')}</> : <><Sparkles size={14} /> {t('home.newToday')}</>}</span>
          <h2>{t('home.aroundWorld')}</h2>
          <p>{t('home.dailyDetail')}</p>
          <span className="daily-card__action">{dailyDone ? t('home.practiceAgain') : t('home.playNow')} <ChevronRight size={17} /></span>
        </div>
        <div className="daily-card__flag"><span className="mystery-flag" aria-hidden="true" /><span>?</span></div>
      </button>

      <div className="section-title-row"><div><p className="eyebrow">{t('home.chooseRoute')}</p><h2>{t('home.gameModes')}</h2></div></div>

      <div className="mode-grid">
        <button className="mode-card mode-card--career" onClick={() => setScreen('career')}>
          <span className="mode-card__icon"><Compass /></span>
          <span><strong>{t('home.journeyMode')}</strong><small>{t('home.journeyModeDetail')}</small></span>
          <ChevronRight />
        </button>
        <button className="mode-card" onClick={() => setScreen('regions')}>
          <span className="mode-card__icon mode-card__icon--blue"><Globe2 /></span>
          <span><strong>{t('home.byRegion')}</strong><small>{t('home.byRegionDetail')}</small></span>
          <ChevronRight />
        </button>
        <button className="mode-card" onClick={() => startGame({ mode: 'quick', title: t('home.quickRound'), subtitle: t('home.quickSubtitle'), pool: countries, questionCount: 10 })}>
          <span className="mode-card__icon mode-card__icon--orange"><Zap /></span>
          <span><strong>{t('home.quickRound')}</strong><small>{t('home.quickDetail')}</small></span>
          <ChevronRight />
        </button>
      </div>

      <section className="progress-strip">
        <div><Award /><span><strong>{Object.values(profile.masteredCountries).filter((value) => value >= 3).length}</strong><small>{t('home.mastered')}</small></span></div>
        <div><Trophy /><span><strong>{profile.completedStages.filter((stage) => stage <= 12).length}/12</strong><small>{t('home.stages')}</small></span></div>
        <div><Star /><span><strong>{profile.totalAnswers ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100) : 0}%</strong><small>{t('home.accuracy')}</small></span></div>
      </section>
    </main>
  );
}

function DifficultySelector({ value, onChange }: { value: Difficulty; onChange: (difficulty: Difficulty) => void }) {
  const { t } = useI18n();
  const labels = { easy: t('difficulty.easy'), normal: t('difficulty.normal'), hard: t('difficulty.hard') };
  return <div className="difficulty-selector" aria-label={t('difficulty.label')}>
    {(Object.values(difficultyRules)).map((rule) => <button key={rule.id} className={value === rule.id ? 'active' : ''} onClick={() => onChange(rule.id)}>
      <strong>{labels[rule.id]}</strong><small>{rule.questionCount} {t('common.flags')}</small>
    </button>)}
  </div>;
}

function RegionsScreen({ onBack, startGame }: { onBack: () => void; startGame: (config: GameConfig) => void }) {
  const { t } = useI18n();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const rule = difficultyRules[difficulty];
  return (
    <main className="screen">
      <SectionHeader title={t('regions.title')} subtitle={t('regions.subtitle')} onBack={onBack} />
      <DifficultySelector value={difficulty} onChange={setDifficulty} />
      <div className="region-list">
        {regions.map((region) => {
          const meta = {
            emoji: ({ Americas: '🌎', Europe: '🏛️', Asia: '🌏', Africa: '🌍', Oceania: '🌊' })[region],
            accent: ({ Americas: '#E16D3D', Europe: '#5C7CFA', Asia: '#D39A23', Africa: '#27A36A', Oceania: '#14A3A8' })[region],
            description: t(`region.${region}.description` as `region.${typeof region}.description`),
          };
          const regionName = t(`region.${region}` as `region.${typeof region}`);
          const difficultyName = ({ easy: t('difficulty.easy'), normal: t('difficulty.normal'), hard: t('difficulty.hard') })[difficulty];
          return (
            <button
              className="region-card"
              key={region}
              style={{ '--region-accent': meta.accent } as React.CSSProperties}
              onClick={() => startGame({ mode: 'region', title: regionName, subtitle: `${meta.description} · ${difficultyName}`, pool: chooseDifficultyCountries(getRegionCountries(region), difficulty), questionCount: rule.questionCount, difficulty })}
            >
              <span className="region-card__emoji">{meta.emoji}</span>
              <span><strong>{regionName}</strong><small>{meta.description}</small></span>
              <span className="region-card__count">{getRegionCountries(region).length}</span>
              <ChevronRight />
            </button>
          );
        })}
      </div>
      <aside className="tip-card"><Lightbulb /><p><strong>{t('regions.tipTitle')}</strong>{t('regions.tip')}</p></aside>
    </main>
  );
}

function OriginPickerScreen({ currentCode, onBack, onSelect, required = false }: {
  currentCode: string | null;
  onBack?: () => void;
  onSelect: (country: Country) => void;
  required?: boolean;
}) {
  const { t, language, locale } = useI18n();
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase(locale);
  const filtered = countries.filter((country) => !normalized
    || getCountryName(country, language).toLocaleLowerCase(locale).includes(normalized)
    || t(`region.${country.region}` as `region.${typeof country.region}`).toLocaleLowerCase(locale).includes(normalized));
  return (
    <main className="screen origin-screen">
      {onBack
        ? <SectionHeader title={t('origin.title')} subtitle={t('origin.subtitle')} onBack={onBack} />
        : <section className="onboarding-copy"><p className="eyebrow">{t('origin.eyebrow')}</p><h1>{t('origin.question')}</h1><p>{t('origin.explanation')}</p></section>}
      <label className="country-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('origin.search')} autoFocus /></label>
      {currentCode && <p className="origin-warning">{t('origin.changeWarning')}</p>}
      {required && <p className="origin-warning">{t('origin.required')}</p>}
      <div className="country-picker" aria-label={t('origin.available')}>
        {filtered.sort((a, b) => getCountryName(a, language).localeCompare(getCountryName(b, language), locale)).map((country) => (
          <button key={country.code} className={country.code === currentCode ? 'active' : ''} onClick={() => onSelect(country)}>
            <Flag code={country.code} name={getCountryName(country, language)} size="small" />
            <span><strong>{getCountryName(country, language)}</strong><small>{t(`region.${country.region}` as `region.${typeof country.region}`)}</small></span>
            {country.code === currentCode ? <Check /> : <ChevronRight />}
          </button>
        ))}
      </div>
    </main>
  );
}

function CareerScreen({ profile, startGame, onChooseOrigin, onChooseRoute, onLeaderboard }: {
  profile: PlayerProfile;
  startGame: (config: GameConfig) => void;
  onChooseOrigin: () => void;
  onChooseRoute: (chosenId: number, otherId: number) => void;
  onLeaderboard: () => void;
}) {
  const { t, language, locale } = useI18n();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const rule = difficultyRules[difficulty];
  const homeCountry = countries.find((country) => country.code === profile.homeCountryCode);
  const route = getJourneyRoute(profile);
  const routeWithFinal = route.length === 11 ? [...route, 12] : route;
  const nextChoices = homeCountry && route.length < 11 && profile.unlockedStage > route.length ? getNextRouteChoices(profile) : [];
  const expeditionCountries = getJourneyExpeditionCountries(profile);

  if (!homeCountry) {
    return (
      <main className="screen career-screen route-setup">
        <div className="route-setup__art"><MapPin /><span>✦</span></div>
        <p className="eyebrow">{t('career.mode')}</p><h1>{t('career.whereFrom')}</h1>
        <p>{t('career.setup')}</p>
        <button className="primary-button" onClick={onChooseOrigin}><Globe2 /> {t('career.chooseCountry')}</button>
        <small>{t('career.manual')}</small>
      </main>
    );
  }

  return (
    <main className="screen career-screen">
      <div className="journey-hero"><p className="eyebrow">{t('career.from', { country: getCountryName(homeCountry, language).toLocaleUpperCase(locale) })}</p><h1>{t('career.routeTitle')}</h1><p>{t('career.routeSubtitle')}</p><button className="text-button journey-ranking-link" onClick={onLeaderboard}><Trophy /> {t('career.ranking')}</button></div>
      <DifficultySelector value={difficulty} onChange={setDifficulty} />
      <div className="journey-path">
        {routeWithFinal.map((baseStageId, index) => {
          const stage = journeyStages[baseStageId - 1];
          const stageText = getJourneyStageText(stage, language);
          const stageNumber = index + 1;
          const locked = stageNumber > profile.unlockedStage;
          const completed = profile.completedStages.includes(stageNumber);
          const isHome = stageNumber === 1;
          return (
            <button
              key={`${stageNumber}-${stage.id}`}
              className={`stage-card ${locked ? 'stage-card--locked' : ''} ${completed ? 'stage-card--complete' : ''}`}
              disabled={locked}
              onClick={() => startGame({
                mode: 'career',
                title: t('career.stageTitle', { stage: stageNumber, title: isHome ? t('career.fromCountry', { country: getCountryName(homeCountry, language) }) : stageText.title }),
                subtitle: stageText.focus,
                pool: chooseDifficultyCountries(getJourneyStagePool(baseStageId, profile), difficulty),
                questionCount: rule.questionCount,
                difficulty,
                stageId: stageNumber,
                contentStageId: baseStageId,
              })}
            >
              <span className="stage-card__number">{locked ? <Lock size={17} /> : completed ? <Check size={19} /> : stageNumber}</span>
              <span className="stage-card__copy"><small>{stage.emoji} {isHome ? t('career.yourRegion', { country: getCountryName(homeCountry, language) }) : stageText.label}</small><strong>{stageText.title}</strong><em>{stageText.focus} · {rule.questionCount} {t('common.flags')} · {({ easy: t('difficulty.easy'), normal: t('difficulty.normal'), hard: t('difficulty.hard') })[difficulty]}</em></span>
              {!locked && <ChevronRight />}
            </button>
          );
        })}
        {nextChoices.length === 2 && (
          <section className="route-choice">
            <div className="route-choice__heading"><Plane /><div><p className="eyebrow">{t('career.nextFork')}</p><h2>{t('career.whereNext')}</h2></div></div>
            <div className="route-choice__options">
              {nextChoices.map((stage) => {
                const stageText = getJourneyStageText(stage, language);
                return <button key={stage.id} onClick={() => onChooseRoute(stage.id, nextChoices.find((option) => option.id !== stage.id)!.id)}>
                  <span>{stage.emoji}</span><strong>{stageText.title}</strong><small>{stageText.label} · {t('career.difficulty')} {'●'.repeat(stage.difficulty)}{'○'.repeat(3 - stage.difficulty)}</small><em>{t('career.visitFirst')} <ChevronRight /></em>
                </button>;
              })}
            </div>
            <p>{t('career.otherNext')}</p>
          </section>
        )}
        {route.length < 11 && !nextChoices.length && <div className="route-checkpoint"><Lock /><span><strong>{t('career.unlockTitle')}</strong><small>{t('career.unlockDetail')}</small></span></div>}
        <button
          className={`stage-card stage-card--expedition ${profile.unlockedStage < 13 ? 'stage-card--locked' : ''}`}
          disabled={profile.unlockedStage < 13}
          onClick={() => startGame({
            mode: 'career',
            title: t('career.expeditionTitle'),
            subtitle: t('career.expeditionSubtitle'),
            pool: chooseDifficultyCountries(getExpeditionPool(profile), difficulty),
            questionCount: rule.questionCount,
            difficulty,
            stageId: 13,
          })}
        >
          <span className="stage-card__number">{profile.unlockedStage < 13 ? <Lock size={17} /> : <Globe2 size={19} />}</span>
          <span className="stage-card__copy"><small>{t('career.completeCollection')}</small><strong>{t('career.expeditionTitle')}</strong><em>{t('career.flagsFound', { seen: Math.min(profile.expeditionSeen.length, expeditionCountries.length), total: expeditionCountries.length })}</em></span>
          {profile.unlockedStage >= 13 && <ChevronRight />}
        </button>
      </div>
    </main>
  );
}

function JourneyGameScreen({ config, profile, setProfile, onExit, onComplete }: {
  config: GameConfig;
  profile: PlayerProfile;
  setProfile: (profile: PlayerProfile) => void;
  onExit: () => void;
  onComplete: (reward: SessionReward, records: AnswerRecord[], config: GameConfig) => void;
}) {
  const { t, language, locale } = useI18n();
  const rule = difficultyRules[config.difficulty || 'normal'];
  const stageCountries = useMemo(() => config.pool.slice(0, config.questionCount), [config]);
  const flagOrder = useMemo(() => shuffle(stageCountries), [stageCountries]);
  const groups = useMemo(() => {
    let cursor = 0;
    return rule.groupSizes.map((size) => {
      const group = flagOrder.slice(cursor, cursor + size);
      cursor += size;
      return group;
    });
  }, [flagOrder, rule.groupSizes]);
  const duration = rule.durationSeconds;
  const [deadline] = useState(() => Date.now() + duration * 1000);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [groupIndex, setGroupIndex] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(() => new Set());
  const [lives, setLives] = useState(profile.campaignHearts);
  const [feedback, setFeedback] = useState<{ correct: boolean; name: string } | null>(null);
  const [hintFor, setHintFor] = useState<string | null>(null);
  const [hintCandidates, setHintCandidates] = useState<string[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const premiumHintKey = `atlas-premium-hints-${today}`;
  const [premiumHintsUsed, setPremiumHintsUsed] = useState(() => Number(localStorage.getItem(premiumHintKey) || 0));
  const freePremiumHints = profile.isPremium ? Math.max(0, 3 - premiumHintsUsed) : 0;
  const resolvedRef = useRef(resolved);
  const hintedRef = useRef<Set<string>>(new Set());
  const wrongAttemptsRef = useRef<globalThis.Map<string, number>>(new globalThis.Map());
  const selectedCodesRef = useRef<globalThis.Map<string, string[]>>(new globalThis.Map());
  const livesRef = useRef(profile.campaignHearts);
  const [stageHintsUsed, setStageHintsUsed] = useState(0);
  const doneRef = useRef(false);
  const currentGroup = groups[groupIndex] || [];

  const finishJourney = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const records: AnswerRecord[] = stageCountries.map((country) => ({
      questionId: `${config.stageId}-${country.code}`,
      countryCode: country.code,
      correct: resolvedRef.current.has(country.code),
      usedHint: hintedRef.current.has(country.code),
      wrongAttempts: wrongAttemptsRef.current.get(country.code) || 0,
      elapsedSeconds: duration - Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      selectedCodes: selectedCodesRef.current.get(country.code) || [],
    }));
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const result = completeSession({ ...profile, campaignHearts: livesRef.current }, config, records, isoDate(), remaining);
    setProfile(result.profile);
    onComplete(result.reward, records, config);
  };

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) finishJourney();
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(timer);
    // The fixed deadline deliberately survives backgrounding and screen locks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  const chooseFlag = (country: Country) => {
    if (!selectedName || feedback || resolved.has(country.code)) return;
    const correct = selectedName === country.code;
    const chosenCountry = stageCountries.find((item) => item.code === selectedName);
    const chosenName = chosenCountry ? getCountryName(chosenCountry, language) : '';
    playFeedback(correct, profile.soundEnabled, profile.hapticsEnabled);
    selectedCodesRef.current.set(country.code, [
      ...(selectedCodesRef.current.get(country.code) || []),
      selectedName,
    ]);
    setFeedback({ correct, name: chosenName });

    if (!correct) {
      const nextLives = Math.max(0, lives - 1);
      wrongAttemptsRef.current.set(country.code, (wrongAttemptsRef.current.get(country.code) || 0) + 1);
      livesRef.current = nextLives;
      setLives(nextLives);
      setSelectedName(null);
      window.setTimeout(() => {
        setFeedback(null);
        if (nextLives === 0) finishJourney();
      }, 520);
      return;
    }

    const nextResolved = new Set(resolved);
    nextResolved.add(country.code);
    resolvedRef.current = nextResolved;
    setResolved(nextResolved);
    setSelectedName(null);
    setHintFor(null);
    setHintCandidates([]);
    window.setTimeout(() => {
      setFeedback(null);
      const groupComplete = currentGroup.every((flag) => nextResolved.has(flag.code));
      if (!groupComplete) return;
      if (nextResolved.size === stageCountries.length) finishJourney();
      else setGroupIndex((current) => Math.min(current + 1, groups.length - 1));
    }, 520);
  };

  const revealHint = () => {
    const target = currentGroup.find((country) => !resolved.has(country.code));
    if (!target) return;
    const decoy = shuffle(stageCountries.filter((country) => !resolved.has(country.code) && country.code !== target.code))[0];
    hintedRef.current.add(target.code);
    setSelectedName(null);
    setHintFor(target.code);
    setHintCandidates(shuffle([target.code, ...(decoy ? [decoy.code] : [])]));
  };

  const useJourneyHint = () => {
    if (feedback || hintFor) return;
    if (stageHintsUsed < 2) {
      setStageHintsUsed((current) => current + 1);
    } else if (freePremiumHints > 0) {
      const nextUsed = premiumHintsUsed + 1;
      setPremiumHintsUsed(nextUsed);
      localStorage.setItem(premiumHintKey, String(nextUsed));
    } else {
      if (profile.coins < 30) return;
      setProfile({ ...profile, coins: profile.coins - 30 });
    }
    revealHint();
  };

  const useRewardedJourneyHint = async () => {
    if (feedback || hintFor || adLoading) return;
    setAdLoading(true);
    if (await monetization.showRewardedHint()) revealHint();
    setAdLoading(false);
  };

  return (
    <main className="game-screen journey-game" onContextMenu={(event) => event.preventDefault()}>
      <header className="game-header">
        <button className="icon-button icon-button--light" onClick={onExit} aria-label={t('journey.exit')}><X /></button>
        <div className="game-header__center"><strong>{config.title}</strong><span>{t('journey.group', { current: groupIndex + 1, total: groups.length })}</span></div>
        <div className={`journey-timer ${timeLeft <= 20 ? 'journey-timer--danger' : ''}`}><Clock3 /> {timeLeft}</div>
      </header>
      <div className="journey-status">
        <div className="journey-groups" aria-label={t('journey.group', { current: groupIndex + 1, total: groups.length })}>{groups.map((_, index) => <span key={index} className={index < groupIndex ? 'complete' : index === groupIndex ? 'active' : ''} />)}</div>
        <div className="lives" aria-label={t('journey.lives', { count: lives })}><Heart fill="currentColor" /> {lives}</div>
      </div>

      <section className="journey-flags">
        <p className="question-label">{t('journey.instruction')}</p>
        <div className={`journey-flag-grid journey-flag-grid--${currentGroup.length}`}>
          {currentGroup.every((country) => resolved.has(country.code))
            ? <div className="group-complete"><Check /> {t('journey.groupComplete')}</div>
            : currentGroup.map((country) => {
                const isResolved = resolved.has(country.code);
                return (
                  <button
                    key={country.code}
                    className={`${hintFor === country.code ? 'hinted' : ''} ${isResolved ? 'resolved' : ''}`}
                    onClick={() => chooseFlag(country)}
                    disabled={isResolved || !selectedName || Boolean(feedback)}
                    aria-label={isResolved ? t('journey.flagResolved', { country: getCountryName(country, language) }) : t('journey.selectFlag', { country: getCountryName(country, language) })}
                  >
                    <Flag code={country.code} name={getCountryName(country, language)} size={currentGroup.length === 1 ? 'hero' : 'large'} />
                    {isResolved ? <Check className="flag-resolved-mark" /> : hintFor === country.code && <Lightbulb />}
                  </button>
                );
              })}
        </div>
        {feedback && <div className={`journey-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>{feedback.correct ? <><Check /> {t('journey.correct')}</> : <><X /> {t('journey.notCountry', { country: feedback.name })}</>}</div>}
      </section>

      <section className="journey-names" aria-label={t('journey.countryNames')}>
        {[...stageCountries].sort((a, b) => getCountryName(a, language).localeCompare(getCountryName(b, language), locale)).map((country) => (
          <button
            key={country.code}
            className={`${selectedName === country.code ? 'selected' : ''} ${resolved.has(country.code) ? 'resolved' : ''} ${hintCandidates.includes(country.code) ? 'hinted' : ''}`}
            disabled={resolved.has(country.code) || Boolean(feedback)}
            onClick={() => setSelectedName(country.code)}
          >
            {resolved.has(country.code) ? <Check /> : <span />}{getCountryName(country, language)}
          </button>
        ))}
      </section>

      <div className="journey-footer">
        <span>{t('journey.associated', { resolved: resolved.size, total: stageCountries.length, lives })}</span>
        <div className="hint-actions">
          <button onClick={useJourneyHint} disabled={Boolean(hintFor) || (stageHintsUsed >= 2 && freePremiumHints === 0 && profile.coins < 30)}><Lightbulb /> {stageHintsUsed < 2 ? t('journey.hintCount', { count: 2 - stageHintsUsed }) : freePremiumHints > 0 ? t('journey.proCount', { count: freePremiumHints }) : <>{t('journey.hint')} <span>30 <CircleDollarSign /></span></>}</button>
          <button onClick={useRewardedJourneyHint} disabled={Boolean(hintFor) || adLoading}><Gift /> {adLoading ? t('common.loading') : t('journey.watchAd')}</button>
        </div>
      </div>
    </main>
  );
}

function QuestionPrompt({ question }: { question: Question }) {
  const { t, language } = useI18n();
  if (question.kind === 'flag-to-name') {
    return <><p className="question-label">{t('game.questionFlag')}</p><div className="question-flag"><Flag code={question.answer.code} name={getCountryName(question.answer, language)} size="hero" /></div></>;
  }
  if (question.kind === 'capital-to-flag') {
    return <><p className="question-label">{t('game.questionCapital')}</p><h2 className="question-word">{getCapitalName(question.answer, language)}</h2></>;
  }
  return <><p className="question-label">{t('game.findFlag')}</p><h2 className="question-word">{getCountryName(question.answer, language)}</h2></>;
}

function GameScreen({ config, profile, setProfile, onExit, onComplete }: {
  config: GameConfig;
  profile: PlayerProfile;
  setProfile: (profile: PlayerProfile) => void;
  onExit: () => void;
  onComplete: (reward: SessionReward, records: AnswerRecord[], config: GameConfig) => void;
}) {
  const { t, language } = useI18n();
  const questions = useMemo(() => buildQuestions(config), [config]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [lives, setLives] = useState(3);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [adLoading, setAdLoading] = useState(false);
  const premiumHintKey = `atlas-premium-hints-${today}`;
  const [premiumHintsUsed, setPremiumHintsUsed] = useState(() => Number(localStorage.getItem(premiumHintKey) || 0));
  const question = questions[index];
  const isCorrect = selected === question.answer.code;
  const freePremiumHints = profile.isPremium ? Math.max(0, 3 - premiumHintsUsed) : 0;

  const finish = (finalRecords: AnswerRecord[]) => {
    const result = completeSession(profile, config, finalRecords);
    setProfile(result.profile);
    onComplete(result.reward, finalRecords, config);
  };

  const answer = (country: Country) => {
    if (selected || hidden.includes(country.code)) return;
    const correct = country.code === question.answer.code;
    const record: AnswerRecord = {
      questionId: question.id,
      countryCode: question.answer.code,
      correct,
      usedHint: hidden.length > 0,
      wrongAttempts: 0,
      elapsedSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      selectedCodes: [country.code],
    };
    setSelected(country.code);
    setRecords((current) => [...current, record]);
    if (!correct) setLives((current) => Math.max(0, current - 1));
    playFeedback(correct, profile.soundEnabled, profile.hapticsEnabled);
  };

  const next = () => {
    const finalRecords = records;
    if (index >= questions.length - 1 || lives === 0) {
      finish(finalRecords);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setHidden([]);
    setStartedAt(Date.now());
  };

  const useCoinHint = () => {
    if (selected || hidden.length) return;
    if (freePremiumHints > 0) {
      const nextUsed = premiumHintsUsed + 1;
      setPremiumHintsUsed(nextUsed);
      localStorage.setItem(premiumHintKey, String(nextUsed));
    } else {
      if (profile.coins < 30) return;
      setProfile({ ...profile, coins: profile.coins - 30 });
    }
    setHidden(hiddenOptionCodes(question));
  };

  const useRewardedHint = async () => {
    if (selected || hidden.length || adLoading) return;
    setAdLoading(true);
    const earned = await monetization.showRewardedHint();
    if (earned) setHidden(hiddenOptionCodes(question));
    setAdLoading(false);
  };

  return (
    <main className="game-screen">
      <header className="game-header">
        <button className="icon-button icon-button--light" onClick={onExit} aria-label={t('game.exit')}><X /></button>
        <div className="game-header__center"><strong>{config.title}</strong><span>{t('game.progress', { current: index + 1, total: questions.length })}</span></div>
        <div className="lives" aria-label={t('journey.lives', { count: lives })}><Heart fill="currentColor" /> {lives}</div>
      </header>
      <div className="progress-track"><span style={{ width: `${((index + (selected ? 1 : 0)) / questions.length) * 100}%` }} /></div>

      <section className="question-area">
        <QuestionPrompt question={question} />
      </section>

      <section className={`answer-grid ${question.kind === 'flag-to-name' ? '' : 'answer-grid--flags'}`}>
        {question.options.map((country, optionIndex) => {
          const isHidden = hidden.includes(country.code);
          const classes = [
            'answer-option',
            selected === country.code ? (isCorrect ? 'answer-option--correct' : 'answer-option--wrong') : '',
            selected && country.code === question.answer.code ? 'answer-option--correct' : '',
            isHidden ? 'answer-option--hidden' : '',
          ].filter(Boolean).join(' ');
          return (
            <button key={country.code} className={classes} onClick={() => answer(country)} disabled={Boolean(selected) || isHidden}>
              <span className="option-index">{String.fromCharCode(65 + optionIndex)}</span>
              {question.kind !== 'flag-to-name' && <Flag code={country.code} name={getCountryName(country, language)} size="medium" />}
              {question.kind === 'flag-to-name' && <strong>{getCountryName(country, language)}</strong>}
              {selected && country.code === question.answer.code && <Check className="option-status" />}
              {selected === country.code && !isCorrect && <X className="option-status" />}
            </button>
          );
        })}
      </section>

      {!selected ? (
        <div className="hint-actions">
          <button onClick={useCoinHint} disabled={hidden.length > 0 || (freePremiumHints === 0 && profile.coins < 30)}><Lightbulb /> {freePremiumHints > 0 ? t('journey.proCount', { count: freePremiumHints }) : <>{t('journey.hint')} <span>30 <CircleDollarSign /></span></>}</button>
          <button onClick={useRewardedHint} disabled={hidden.length > 0 || adLoading}><Gift /> {adLoading ? t('common.loading') : t('journey.watchAd')}</button>
        </div>
      ) : (
        <section className={`feedback-card ${isCorrect ? 'feedback-card--correct' : 'feedback-card--wrong'}`}>
          <div className="feedback-card__title"><span>{isCorrect ? <Check /> : <X />}</span><div><strong>{isCorrect ? t('game.excellent') : t('game.was', { country: getCountryName(question.answer, language) })}</strong><small>{getCapitalName(question.answer, language)} · {formatPopulation(question.answer.population, language)}{question.answer.population > 0 ? ` ${t('game.inhabitants')}` : ''}</small></div></div>
          <button className="primary-button" onClick={next}>{index >= questions.length - 1 || lives === 0 ? t('game.showResult') : t('common.continue')} <ChevronRight /></button>
        </section>
      )}
    </main>
  );
}

function ResultsModal({ reward, records, config, rankingStatus, onClose, onReplay }: {
  reward: SessionReward;
  records: AnswerRecord[];
  config: GameConfig;
  rankingStatus?: RankingStatus;
  onClose: () => void;
  onReplay: () => void;
}) {
  const { t } = useI18n();
  const accuracy = Math.round((reward.correct / reward.total) * 100);
  const share = async () => {
    const tiles = records.map((answer) => (answer.correct ? '🟩' : '🟥')).join('');
    const text = t('share.text', { app: t('app.name'), date: today, tiles, correct: reward.correct, total: reward.total });
    if (navigator.share) await navigator.share({ title: t('app.name'), text }).catch(() => undefined);
    else await navigator.clipboard.writeText(text);
  };
  return (
    <div className="modal-backdrop">
      <section className="results-modal" role="dialog" aria-modal="true" aria-label={t('results.dialog')}>
        <div className="result-emblem"><Trophy /></div>
        <p className="eyebrow">{t('results.completed')}</p>
        <h2>{accuracy === 100 ? t('results.perfect') : accuracy >= 70 ? t('results.great') : t('results.learning')}</h2>
        <p className="result-subtitle">{config.title}</p>
        <div className="result-score"><strong>{reward.score} {t('common.points')}</strong><span>{t('results.accuracy', { correct: reward.correct, total: reward.total, accuracy })}</span></div>
        <div className="result-tiles">{records.map((answer, index) => <span key={index} className={answer.correct ? 'correct' : 'wrong'} />)}</div>
        <div className="score-breakdown" aria-label={t('results.breakdown')}>
          <span>{t('results.flags')} <strong>{reward.baseScore}</strong></span>
          <span>{t('results.time')} <strong>+{reward.timeBonus}</strong></span>
          {reward.cleanBonus > 0 && <span>{t('results.cleanRoute')} <strong>+{reward.cleanBonus}</strong></span>}
          <span>{t('results.hintsErrors', { hints: reward.hintsUsed, errors: reward.mistakes })}</span>
        </div>
        <div className="reward-row"><span><Zap /> +{reward.xp} XP</span><span><CircleDollarSign /> +{reward.coins}</span>{reward.newStageUnlocked && <span><Lock /> {t('results.newStage')}</span>}</div>
        {config.mode === 'career' && rankingStatus && <p className={`ranking-result ranking-result--${rankingStatus}`}>{rankingStatus === 'publishing' ? t('results.publishing') : rankingStatus === 'published' ? t('results.published') : rankingStatus === 'not-qualified' ? t('results.notQualified') : rankingStatus === 'offline' ? t('results.offline') : t('results.publishError')}</p>}
        <button className="primary-button" onClick={onClose}>{t('results.backMap')}</button>
        <div className="result-secondary"><button onClick={onReplay}><RotateCcw /> {t('results.replay')}</button><button onClick={share}><Share2 /> {t('results.share')}</button></div>
      </section>
    </div>
  );
}

function LeaderboardScreen({ profile, onBack, onAccount }: { profile: PlayerProfile; onBack: () => void; onAccount: () => void }) {
  const { t, language } = useI18n();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [scope, setScope] = useState<'world' | 'country' | 'region'>('world');
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const homeCountry = countries.find((country) => country.code === profile.homeCountryCode);
  const entryCountryName = (code: string | null) => {
    const country = countries.find((item) => item.code === code);
    return country ? getCountryName(country, language) : code || t('leaderboard.noCountry');
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getLeaderboard({
      difficulty,
      country: scope === 'country' ? homeCountry?.code : undefined,
      region: scope === 'region' ? homeCountry?.region : undefined,
    }).then((response) => {
      if (active) setItems(response.items);
    }).catch(() => {
      if (active) setError(t('leaderboard.error'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [difficulty, homeCountry?.code, homeCountry?.region, language, scope]);

  return (
    <main className="screen leaderboard-screen">
      <SectionHeader title={t('leaderboard.title')} subtitle={t('leaderboard.subtitle')} onBack={onBack} />
      <DifficultySelector value={difficulty} onChange={setDifficulty} />
      <div className="ranking-scopes">
        <button className={scope === 'world' ? 'active' : ''} onClick={() => setScope('world')}>{t('leaderboard.world')}</button>
        <button className={scope === 'region' ? 'active' : ''} onClick={() => setScope('region')} disabled={!homeCountry}>{t('leaderboard.myRegion')}</button>
        <button className={scope === 'country' ? 'active' : ''} onClick={() => setScope('country')} disabled={!homeCountry}>{t('leaderboard.myCountry')}</button>
      </div>
      {!profile.rankedProfileReady && <button className="ranking-join" onClick={onAccount}><Trophy /><span><strong>{t('leaderboard.join')}</strong><small>{t('leaderboard.joinDetail')}</small></span><ChevronRight /></button>}
      <section className="leaderboard-list" aria-live="polite">
        {loading && <p className="empty-state">{t('leaderboard.loading')}</p>}
        {!loading && error && <p className="empty-state">{error}</p>}
        {!loading && !error && !items.length && <p className="empty-state">{t('leaderboard.empty')}</p>}
        {items.map((entry) => (
          <article key={entry.user_id} className="leaderboard-entry">
            <strong className="leaderboard-entry__rank">#{entry.rank}</strong>
            <div><strong>{entry.display_name || entry.username}</strong><small>{t('leaderboard.entry', { country: entryCountryName(entry.country), stages: entry.stages_completed, hints: entry.total_hints_used })}</small></div>
            <span><strong>{entry.total_score}</strong><small>{t('common.points')}</small></span>
          </article>
        ))}
      </section>
    </main>
  );
}

function AccountScreen({ profile, onBack, onConnected }: { profile: PlayerProfile; onBack: () => void; onConnected: (session: RankingSession, alias: string) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [alias, setAlias] = useState(profile.displayName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedAlias = alias.trim();
    if (!trimmedAlias || !password || (mode === 'register' && !email)) {
      setStatus(t('account.missing'));
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      if (mode === 'register') {
        const normalizedEmail = email.trim();
        await registerRankingAccount({ username: trimmedAlias, email: normalizedEmail, password });
        setVerificationEmail(normalizedEmail);
        setStatus(t('account.created'));
        setMode('login');
      } else {
        const session = await loginRankingAccount(trimmedAlias, password);
        onConnected(session, trimmedAlias);
        onBack();
      }
    } catch {
      setStatus(t('account.operationError'));
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    if (!verificationEmail) return;
    setBusy(true);
    try {
      await resendVerificationEmail(verificationEmail);
      setStatus(t('account.resent'));
    } catch {
      setStatus(t('account.resendError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="screen account-screen">
      <SectionHeader title={t('account.title')} subtitle={t('account.subtitle')} onBack={onBack} />
      <div className="account-tabs"><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>{t('account.create')}</button><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{t('account.login')}</button></div>
      <form className="account-form" onSubmit={submit}>
        <label>{t('account.publicAlias')}<input value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={24} placeholder={t('account.aliasExample')} autoComplete="username" /></label>
        {mode === 'register' && <label>{t('account.email')}<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" /></label>}
        <label>{t('account.password')}<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} placeholder={t('account.passwordHint')} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
        <button className="primary-button" disabled={busy}>{busy ? t('account.connecting') : mode === 'register' ? t('account.create') : t('account.login')}</button>
        {mode === 'login' && verificationEmail && <button type="button" className="text-button" disabled={busy} onClick={() => { void resendVerification(); }}>{t('account.resend')}</button>}
        {status && <p className="account-status">{status}</p>}
      </form>
      <section className="content-card"><ShieldCheck /><h2>{t('account.localTitle')}</h2><p>{t('account.localDetail')}</p></section>
    </main>
  );
}

function ProgressScreen({ profile }: { profile: PlayerProfile }) {
  const { t, language } = useI18n();
  const accuracy = profile.totalAnswers ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100) : 0;
  const mastered = Object.entries(profile.masteredCountries).filter(([, value]) => value >= 3);
  const recent = mastered.slice(-6).reverse().map(([code]) => countries.find((country) => country.code === code)).filter(Boolean) as Country[];
  const level = Math.floor(profile.xp / 250) + 1;
  return (
    <main className="screen">
      <section className="profile-hero">
        <div className="avatar"><Globe2 /></div>
        <p className="eyebrow">{t('progress.explorer', { level })}</p><h1>{profile.displayName || t('progress.passport')}</h1>
        <div className="xp-bar"><span style={{ width: `${((profile.xp % 250) / 250) * 100}%` }} /></div><small>{t('progress.nextLevel', { xp: profile.xp % 250 })}</small>
      </section>
      <div className="stats-grid">
        <div><Flame /><strong>{profile.streak}</strong><span>{t('progress.streak')}</span></div>
        <div><Star /><strong>{accuracy}%</strong><span>{t('progress.accuracy')}</span></div>
        <div><FlagIcon /><strong>{mastered.length}</strong><span>{t('progress.mastered')}</span></div>
        <div><Trophy /><strong>{profile.completedStages.length}</strong><span>{t('progress.stages')}</span></div>
      </div>
      <section className="content-card">
        <div className="section-title-row"><div><p className="eyebrow">{t('progress.collection')}</p><h2>{t('progress.masteredFlags')}</h2></div><span>{mastered.length}/195</span></div>
        {recent.length ? <div className="mastered-flags">{recent.map((country) => <div key={country.code}><Flag code={country.code} name={getCountryName(country, language)} /><small>{getCountryName(country, language)}</small></div>)}</div> : <p className="empty-state">{t('progress.empty')}</p>}
      </section>
      <section className="content-card streak-card"><div><Flame /><span><strong>{t('progress.days', { count: profile.streak })}</strong><small>{t('progress.comeBack')}</small></span></div><div className="week-dots">{[0,1,2,3,4,5,6].map((day) => <span key={day} className={day < Math.min(profile.streak, 7) ? 'active' : ''}>{day < Math.min(profile.streak, 7) && <Check />}</span>)}</div></section>
    </main>
  );
}

function StoreScreen({ profile, setProfile, onBack }: { profile: PlayerProfile; setProfile: (profile: PlayerProfile) => void; onBack: () => void }) {
  const { t } = useI18n();
  const [aPackage, setPackage] = useState<PurchasesPackage | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { monetization.getPremiumPackage().then(setPackage).catch(() => undefined); }, []);

  const buy = async () => {
    if (!aPackage) { setStatus(t('store.configure')); return; }
    setBusy(true);
    try {
      const premium = await monetization.buyPremium(aPackage);
      if (premium) { setProfile({ ...profile, isPremium: true }); setStatus(t('store.activated')); }
    } catch { setStatus(t('store.purchaseError')); }
    setBusy(false);
  };
  const restore = async () => {
    setBusy(true);
    try {
      const premium = await monetization.restorePremium();
      setProfile({ ...profile, isPremium: premium });
      setStatus(premium ? t('store.restored') : t('store.notFound'));
    } catch { setStatus(t('store.restoreError')); }
    setBusy(false);
  };
  return (
    <main className="screen">
      <SectionHeader title={t('store.title')} subtitle={t('store.subtitle')} onBack={onBack} />
      <section className="pro-card">
        <div className="pro-card__glow" /><ShieldCheck />
        <p className="eyebrow">{t('store.singlePayment')}</p><h2>{t('store.explore')}</h2>
        <ul><li><Check /> {t('store.noAds')}</li><li><Check /> {t('store.freeHints')}</li><li><Check /> {t('store.badge')}</li><li><Check /> {t('store.support')}</li></ul>
        <div className="pro-price">{aPackage?.product.priceString || t('store.playPrice')}<small>{t('store.noRenewal')}</small></div>
        <button className="primary-button primary-button--gold" onClick={buy} disabled={busy || profile.isPremium}>{profile.isPremium ? t('store.active') : busy ? t('store.processing') : t('store.get')}</button>
        <button className="text-button" onClick={restore} disabled={busy}>{t('store.restore')}</button>
        {status && <p className="store-status">{status}</p>}
      </section>
      <section className="content-card"><div className="store-coins"><CircleDollarSign /><div><strong>{t('store.coins', { count: profile.coins })}</strong><small>{t('store.coinsDetail')}</small></div></div><p className="store-note">{t('store.rewarded')}</p></section>
    </main>
  );
}

function SettingsScreen({ profile, session, adPrivacyOptionsRequired, setProfile, onBack, onPrivacy, onAdPrivacy, onOrigin, onAccount, onAliasChange, onSignOut, onDeleteAccount }: { profile: PlayerProfile; session: RankingSession | null; adPrivacyOptionsRequired: boolean; setProfile: (profile: PlayerProfile) => void; onBack: () => void; onPrivacy: () => void; onAdPrivacy: () => void; onOrigin: () => void; onAccount: () => void; onAliasChange: (alias: string | null) => void; onSignOut: () => void; onDeleteAccount: () => void }) {
  const { t, language, setLanguage } = useI18n();
  const homeCountry = countries.find((country) => country.code === profile.homeCountryCode);
  return (
    <main className="screen">
      <SectionHeader title={t('settings.title')} onBack={onBack} />
      <section className="settings-list">
        <button onClick={() => setProfile({ ...profile, soundEnabled: !profile.soundEnabled })}><span>{profile.soundEnabled ? <Volume2 /> : <VolumeX />}<strong>{t('settings.sounds')}</strong></span><i className={profile.soundEnabled ? 'toggle active' : 'toggle'} /></button>
        <button onClick={() => setProfile({ ...profile, hapticsEnabled: !profile.hapticsEnabled })}><span><Gamepad2 /><strong>{t('settings.vibration')}</strong></span><i className={profile.hapticsEnabled ? 'toggle active' : 'toggle'} /></button>
        <div className="language-setting"><span><Globe2 /><strong>{t('settings.language')}</strong></span><div className="language-options" role="group" aria-label={t('settings.language')}>{languageOptions.map((option) => <button key={option.code} className={language === option.code ? 'active' : ''} onClick={() => setLanguage(option.code)} aria-label={option.label}>{option.short}</button>)}</div></div>
        <button onClick={onOrigin}><span><MapPin /><span className="setting-copy"><strong>{t('settings.origin')}</strong><small>{homeCountry ? getCountryName(homeCountry, language) : t('settings.notChosen')}</small></span></span><ChevronRight /></button>
        <button onClick={() => {
          const nextAlias = window.prompt(t('settings.aliasPrompt'), profile.displayName || '');
          if (nextAlias === null) return;
          const displayName = nextAlias.trim().slice(0, 24) || null;
          setProfile({ ...profile, displayName });
          onAliasChange(displayName);
        }}><span><Trophy /><span className="setting-copy"><strong>{t('settings.alias')}</strong><small>{profile.displayName || t('settings.aliasDetail')}</small></span></span><ChevronRight /></button>
        <button onClick={session ? onSignOut : onAccount}><span><ShieldCheck /><span className="setting-copy"><strong>{session ? t('settings.rankingSession') : t('settings.rankingAccount')}</strong><small>{session ? t('settings.connectedAs', { username: session.username }) : t('settings.createAccount')}</small></span></span><ChevronRight /></button>
        <button onClick={onPrivacy}><span><ShieldCheck /><strong>{t('settings.privacy')}</strong></span><ChevronRight /></button>
        {!profile.isPremium && adPrivacyOptionsRequired && <button onClick={onAdPrivacy}><span><ShieldCheck /><span className="setting-copy"><strong>{t('settings.adOptions')}</strong><small>{t('settings.adOptionsDetail')}</small></span></span><ChevronRight /></button>}
        {session && <button className="danger-setting" onClick={onDeleteAccount}><span><Trash2 /><span className="setting-copy"><strong>{t('settings.deleteAccount')}</strong><small>{t('settings.deleteDetail')}</small></span></span><ChevronRight /></button>}
      </section>
      <section className="content-card about-card"><Globe2 /><h2>{t('app.name')}</h2><p>{t('settings.version')}</p><small>{t('settings.tagline')}</small></section>
    </main>
  );
}

function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <main className="screen legal-screen">
      <SectionHeader title={t('privacy.title')} subtitle={t('privacy.updated')} onBack={onBack} />
      <section className="content-card">
        <h2>{t('privacy.summaryTitle')}</h2>
        <p>{t('privacy.summary')}</p>
        <h2>{t('privacy.accountTitle')}</h2>
        <p>{t('privacy.account')}</p>
        <h2>{t('privacy.adsTitle')}</h2>
        <p>{t('privacy.ads')}</p>
        <h2>{t('privacy.purchasesTitle')}</h2>
        <p>{t('privacy.purchases')}</p>
        <h2>{t('privacy.controlTitle')}</h2>
        <p>{t('privacy.control')} <a href="mailto:contacto@banderas-paises-regiones.com">contacto@banderas-paises-regiones.com</a>.</p>
        <p>{t('privacy.age')}</p>
      </section>
    </main>
  );
}

function WelcomeModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="modal-backdrop welcome-backdrop">
      <section className="welcome-modal" role="dialog" aria-modal="true">
        <div className="welcome-art"><span>🌍</span><i>✦</i><b>✦</b></div>
        <p className="eyebrow">{t('welcome.eyebrow')}</p><h2>{t('welcome.title')}</h2><p>{t('welcome.detail')}</p>
        <div className="welcome-features"><span><Zap />{t('welcome.quick')}</span><span><Map />{t('welcome.stages')}</span><span><Award />{t('welcome.local')}</span></div>
        <button className="primary-button" onClick={onClose}>{t('welcome.start')} <ChevronRight /></button>
      </section>
    </div>
  );
}

export default function App() {
  const { t } = useI18n();
  const [profile, setProfileState] = useState(loadProfile);
  const [rankingSession, setRankingSession] = useState<RankingSession | null>(loadRankingSession);
  const [screen, setScreen] = useState<Screen>(() => loadProfile().homeCountryCode ? 'home' : 'onboarding');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('atlas-flags-welcomed'));
  const [originReturn, setOriginReturn] = useState<'career' | 'settings' | 'home'>('home');
  const [adPrivacyOptionsRequired, setAdPrivacyOptionsRequired] = useState(false);
  const startingGameRef = useRef(false);

  const setProfile = (next: PlayerProfile) => { setProfileState(next); saveProfile(next); };

  const syncRanking = async (session: RankingSession, nextProfile: PlayerProfile) => {
    const country = countries.find((item) => item.code === nextProfile.homeCountryCode);
    if (!country) return;
    try {
      const response = await updateRankingProfile(session, {
        displayName: nextProfile.displayName,
        country: country.code,
        region: country.region,
      });
      setProfile({ ...nextProfile, rankedProfileReady: response.ranked_profile_ready });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearRankingSession();
        setRankingSession(null);
      }
    }
  };

  const connectRanking = (session: RankingSession, alias: string) => {
    const nextProfile = { ...profile, displayName: alias || profile.displayName };
    setProfile(nextProfile);
    setRankingSession(session);
    void syncRanking(session, nextProfile);
  };

  useEffect(() => {
    monetization.initialize(profile.isPremium).then((premium) => {
      if (premium !== profile.isPremium) setProfile({ ...profile, isPremium: premium });
      setAdPrivacyOptionsRequired(monetization.requiresPrivacyOptions());
    });
    // Native services initialize once at app start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener('backButton', () => {
      if (showWelcome) {
        localStorage.setItem('atlas-flags-welcomed', '1');
        setShowWelcome(false);
      } else if (result) {
        setResult(null);
        setGameConfig(null);
        setScreen(result.config.mode === 'career' ? 'career' : 'home');
      } else if (screen === 'game') {
        setGameConfig(null);
        setScreen(gameConfig?.mode === 'career' ? 'career' : 'home');
      } else if (screen !== 'home') {
        setScreen('home');
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => { listener.then((handle) => handle.remove()); };
  }, [gameConfig, result, screen, showWelcome]);

  const startGame = (config: GameConfig) => {
    if (startingGameRef.current) return;
    startingGameRef.current = true;
    void (async () => {
      let nextConfig: GameConfig = { ...config, rankingAttemptId: undefined };
      if (rankingSession && config.mode === 'career' && config.stageId && config.stageId <= 12) {
        try {
          const rankingAttemptId = await beginCareerAttempt(rankingSession, nextConfig);
          nextConfig = { ...nextConfig, rankingAttemptId };
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            clearRankingSession();
            setRankingSession(null);
          }
        }
      }
      setGameConfig(nextConfig);
      setResult(null);
      setScreen('game');
      startingGameRef.current = false;
    })();
  };
  const openOriginPicker = (returnTo: 'career' | 'settings' | 'home') => { setOriginReturn(returnTo); setScreen('origin'); };
  const chooseOrigin = async (country: Country) => {
    if (profile.homeCountryCode === country.code) { setScreen(originReturn); return; }
    if (profile.homeCountryCode && !window.confirm(t('dialog.changeCountry'))) return;
    const nextProfile = {
      ...profile,
      homeCountryCode: country.code,
      journeyRoute: [getHomeStageId(country)],
      unlockedStage: 1,
      completedStages: [],
      expeditionSeen: [],
    };
    if (rankingSession) {
      try {
        const response = await updateRankingProfile(rankingSession, {
          displayName: nextProfile.displayName,
          country: country.code,
          region: country.region,
        });
        nextProfile.rankedProfileReady = response.ranked_profile_ready;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearRankingSession();
          setRankingSession(null);
        }
        window.alert(error instanceof ApiError && error.status === 409 ? t('dialog.originLocked') : t('dialog.originUpdateError'));
        return;
      }
    }
    setProfile(nextProfile);
    setScreen(originReturn);
  };
  const chooseRoute = (chosenId: number, otherId: number) => {
    const route = getJourneyRoute(profile);
    if (route.includes(chosenId) || route.includes(otherId)) return;
    setProfile({ ...profile, journeyRoute: [...route, chosenId, otherId] });
  };
  const closeResults = () => {
    if (result) monetization.maybeShowInterstitial(profile.sessionsCompleted, profile.isPremium);
    setResult(null); setGameConfig(null); setScreen(result?.config.mode === 'career' ? 'career' : 'home');
  };
  const replay = () => {
    if (!result) return;
    setResult(null);
    startGame({
      ...result.config,
      seed: result.config.mode === 'daily' ? result.config.seed : undefined,
      rankingAttemptId: undefined,
    });
  };
  const completeCareer = async (reward: SessionReward, records: AnswerRecord[], config: GameConfig) => {
    if (!rankingSession) {
      setResult({ reward, records, config, rankingStatus: 'offline' });
      return;
    }
    setResult({ reward, records, config, rankingStatus: 'publishing' });
    try {
      const response = await submitCareerStage(rankingSession, config, records);
      setResult({ reward, records, config, rankingStatus: response.ranked ? 'published' : 'not-qualified' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearRankingSession();
        setRankingSession(null);
      }
      setResult({ reward, records, config, rankingStatus: 'error' });
    }
  };
  const changeAlias = (alias: string | null) => {
    const nextProfile = { ...profile, displayName: alias };
    setProfile(nextProfile);
    if (rankingSession) void syncRanking(rankingSession, nextProfile);
  };
  const signOut = () => {
    clearRankingSession();
    setRankingSession(null);
    setProfile({ ...profile, rankedProfileReady: false });
  };
  const deleteAccount = async () => {
    if (!rankingSession) return;
    if (!window.confirm(t('dialog.deleteAccount'))) return;
    try {
      await deleteRankingAccount(rankingSession);
      clearRankingSession();
      setRankingSession(null);
      setProfile({ ...profile, displayName: null, rankedProfileReady: false });
      window.alert(t('dialog.accountDeleted'));
    } catch {
      window.alert(t('dialog.deleteError'));
    }
  };
  const openAdPrivacy = async () => {
    const opened = await monetization.showPrivacyOptions();
    setAdPrivacyOptionsRequired(monetization.requiresPrivacyOptions());
    if (!opened) window.alert(t('dialog.adUnavailable'));
  };

  const regularScreen = screen !== 'game' && screen !== 'onboarding';
  return (
    <div className="app-shell">
      {regularScreen && <TopBar profile={profile} onStore={() => setScreen('store')} onSettings={() => setScreen('settings')} onLeaderboard={() => setScreen('leaderboard')} />}
      {screen === 'onboarding' && <OriginPickerScreen currentCode={null} required onSelect={chooseOrigin} />}
      {screen === 'home' && <HomeScreen profile={profile} startGame={startGame} setScreen={setScreen} />}
      {screen === 'regions' && <RegionsScreen onBack={() => setScreen('home')} startGame={startGame} />}
      {screen === 'career' && <CareerScreen profile={profile} startGame={startGame} onChooseOrigin={() => openOriginPicker('career')} onChooseRoute={chooseRoute} onLeaderboard={() => setScreen('leaderboard')} />}
      {screen === 'origin' && <OriginPickerScreen currentCode={profile.homeCountryCode} onBack={() => setScreen(originReturn)} onSelect={chooseOrigin} />}
      {screen === 'progress' && <ProgressScreen profile={profile} />}
      {screen === 'store' && <StoreScreen profile={profile} setProfile={setProfile} onBack={() => setScreen('home')} />}
      {screen === 'settings' && <SettingsScreen profile={profile} session={rankingSession} adPrivacyOptionsRequired={adPrivacyOptionsRequired} setProfile={setProfile} onBack={() => setScreen('home')} onPrivacy={() => setScreen('privacy')} onAdPrivacy={() => { void openAdPrivacy(); }} onOrigin={() => openOriginPicker('settings')} onAccount={() => setScreen('account')} onAliasChange={changeAlias} onSignOut={signOut} onDeleteAccount={() => { void deleteAccount(); }} />}
      {screen === 'privacy' && <PrivacyScreen onBack={() => setScreen('settings')} />}
      {screen === 'leaderboard' && <LeaderboardScreen profile={profile} onBack={() => setScreen('home')} onAccount={() => setScreen('account')} />}
      {screen === 'account' && <AccountScreen profile={profile} onBack={() => setScreen('settings')} onConnected={connectRanking} />}
      {screen === 'game' && gameConfig && !result && (
        gameConfig.mode === 'career'
          ? <JourneyGameScreen config={gameConfig} profile={profile} setProfile={setProfile} onExit={() => { setGameConfig(null); setScreen('career'); }} onComplete={(reward, records, config) => { void completeCareer(reward, records, config); }} />
          : <GameScreen config={gameConfig} profile={profile} setProfile={setProfile} onExit={() => { setGameConfig(null); setScreen('home'); }} onComplete={(reward, records, config) => setResult({ reward, records, config })} />
      )}
      {regularScreen && !['store', 'settings', 'origin', 'privacy', 'account'].includes(screen) && <BottomNav screen={screen} setScreen={setScreen} />}
      {result && <ResultsModal {...result} onClose={closeResults} onReplay={replay} />}
      {showWelcome && <WelcomeModal onClose={() => { localStorage.setItem('atlas-flags-welcomed', '1'); setShowWelcome(false); }} />}
    </div>
  );
}
