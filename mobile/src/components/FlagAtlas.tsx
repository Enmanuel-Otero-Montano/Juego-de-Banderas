import { useEffect, useState } from 'react';
import { atlasCellState, parseFlagAtlas, visibleAtlas, type FlagAtlas as FlagAtlasData } from '../atlas';
import { countries, getCapitalName, getCountryName } from '../data/countries';
import { useI18n } from '../i18n';
import { getFlagAtlas, type RankingSession } from '../services/api';
import type { Country, RegionKey } from '../types';
import { Flag } from './Flag';

const regions: RegionKey[] = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];

interface FlagAtlasProps {
  session: RankingSession | null;
  onOpenAccount: () => void;
  onOpenJourney: () => void;
}

export function FlagAtlas({ session, onOpenAccount, onOpenJourney }: FlagAtlasProps) {
  const { t, language } = useI18n();
  const [atlas, setAtlas] = useState<FlagAtlasData | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<RegionKey | 'all'>('all');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setAtlas(null);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setAtlas(null);
    setFailed(false);
    getFlagAtlas(session)
      .then((payload) => { if (!cancelled) setAtlas(parseFlagAtlas(payload)); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [session]);

  const visible = visibleAtlas(Boolean(session) && !failed, atlas);
  const discovered = Object.values(visible.flags).filter((entry) => entry.correct >= 1).length;
  const selected = countries.find((country) => country.code === selectedCode) || null;
  const selectedEntry = selectedCode ? visible.flags[selectedCode] : undefined;
  const selectedState = atlasCellState(selectedEntry);

  const regionCount = (region: RegionKey) => {
    const pool = countries.filter((country) => country.region === region);
    const found = pool.filter((country) => visible.flags[country.code]?.correct >= 1).length;
    return { found, total: pool.length };
  };

  const renderCell = (country: Country) => {
    const entry = visible.flags[country.code];
    const state = atlasCellState(entry);
    const name = getCountryName(country, language);
    return (
      <button
        key={country.code}
        type="button"
        className={`atlas-cell atlas-cell--${state}`}
        aria-label={state === 'discovered' ? name : t(state === 'seen' ? 'atlas.seenLabel' : 'atlas.hidden')}
        onClick={() => setSelectedCode(country.code)}
      >
        {state === 'discovered' ? <Flag code={country.code} name={name} size="small" /> : <span className="atlas-slot" />}
      </button>
    );
  };

  const renderGrid = (pool: Country[]) => <div className="atlas-grid">{pool.map(renderCell)}</div>;

  return (
    <section className="content-card atlas-card">
      <div className="section-title-row">
        <div><p className="eyebrow">{t('atlas.eyebrow')}</p><h2>{t('atlas.title')}</h2></div>
        <span>{t('atlas.progress', { discovered, total: countries.length })}</span>
      </div>
      <div className="atlas-bar" role="progressbar" aria-valuenow={discovered} aria-valuemin={0} aria-valuemax={countries.length}>
        <span style={{ width: `${countries.length ? (discovered / countries.length) * 100 : 0}%` }} />
      </div>
      <p className="atlas-notice">{t('atlas.notice')}</p>
      {!session && <button type="button" className="secondary-button" onClick={onOpenAccount}>{t('atlas.signIn')}</button>}
      {session && failed && <p className="empty-state">{t('atlas.error')}</p>}
      {session && !atlas && !failed && <p className="empty-state">{t('atlas.loading')}</p>}
      <div className="atlas-filters" role="tablist">
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{t('atlas.all')}</button>
        {regions.map((region) => {
          const count = regionCount(region);
          return (
            <button key={region} type="button" className={filter === region ? 'active' : ''} onClick={() => setFilter(region)}>
              {t(`region.${region}` as `region.${RegionKey}`)}
              <small>{t('atlas.regionCount', { discovered: count.found, total: count.total })}</small>
            </button>
          );
        })}
      </div>
      {filter === 'all'
        ? regions.map((region) => (
          <div key={region} className="atlas-group">
            <h3>{t(`region.${region}` as `region.${RegionKey}`)}</h3>
            {renderGrid(countries.filter((country) => country.region === region))}
          </div>
        ))
        : renderGrid(countries.filter((country) => country.region === filter))}
      <button type="button" className="secondary-button" onClick={onOpenJourney}>{t('atlas.journey')}</button>
      {selectedCode && (
        <div className="modal-backdrop" onClick={() => setSelectedCode(null)}>
          <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="atlas-detail-title" onClick={(event) => event.stopPropagation()}>
            {selectedState === 'discovered' && selected ? (
              <>
                <Flag code={selected.code} name={getCountryName(selected, language)} size="medium" />
                <h2 id="atlas-detail-title">{getCountryName(selected, language)}</h2>
                <p>{getCapitalName(selected, language)} · {t(`region.${selected.region}` as `region.${RegionKey}`)}</p>
                <p>{t('atlas.detail', { seen: selectedEntry?.seen || 0, correct: selectedEntry?.correct || 0, wrong: selectedEntry?.wrong || 0 })}</p>
              </>
            ) : (
              <>
                <h2 id="atlas-detail-title">{t(selectedState === 'seen' ? 'atlas.seenLabel' : 'atlas.hidden')}</h2>
                <p>{selectedState === 'seen'
                  ? t('atlas.seenDetail', { seen: selectedEntry?.seen || 0, wrong: selectedEntry?.wrong || 0 })
                  : t('atlas.hiddenDetail')}</p>
              </>
            )}
            <button type="button" className="primary-button" onClick={() => setSelectedCode(null)}>{t('common.ok')}</button>
          </section>
        </div>
      )}
    </section>
  );
}
