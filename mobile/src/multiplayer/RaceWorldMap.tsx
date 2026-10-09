import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, WifiOff } from 'lucide-react';
import { apiBaseUrl } from '../services/api';
import { useI18n } from '../i18n';
import type { RaceMember } from './contract';
import { raceText } from './raceCopy';

const colors = ['#1f7058', '#8254a1', '#b65a29', '#266ca0', '#aa4968', '#737023', '#366e70', '#6556b0'];
type Progress = Record<number, { progress: number; mistakes: number }>;

// Memoized independently of the game clock: only roster/progress/layout changes repaint the race.
// The parent keys this component by round so retained lanes reset only between rounds.
export const RaceWorldMap = memo(function RaceWorldMap({ members, currentUserId, localProgress, localSequence, total, progress, pending, connected }: {
  members: RaceMember[];
  currentUserId: number;
  localProgress: number;
  localSequence: number;
  total: number;
  progress: Progress;
  pending: boolean;
  connected: boolean;
}) {
  const { language } = useI18n();
  const text = (key: Parameters<typeof raceText>[1]) => raceText(language, key);
  const [lanes, setLanes] = useState(() => [...members].sort((a, b) => a.seat - b.seat).map((member) => member.user_id));
  const additions = members.filter((member) => !lanes.includes(member.user_id));
  if (additions.length) setLanes([...lanes, ...additions.map((member) => member.user_id)]);
  // RaceState optimistically advances the question. Keep the marker at the last confirmed answer
  // until an acknowledgement or snapshot confirms it.
  const [confirmed, setConfirmed] = useState(() => ({
    progress: pending ? (progress[currentUserId]?.progress ?? 0) : localProgress,
    sequence: localSequence,
  }));
  // Clearing a pending request on a transport error does not confirm its optimistic advance.
  // An acknowledgement advances expected_sequence; a snapshot may also correct progress down.
  const authoritativeLocal = pending ? confirmed.progress
    : localSequence !== confirmed.sequence || localProgress < confirmed.progress ? localProgress : confirmed.progress;
  if (confirmed.progress !== authoritativeLocal || (!pending && confirmed.sequence !== localSequence)) {
    setConfirmed({ progress: authoritativeLocal, sequence: localSequence });
  }
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const count = Math.max(2, lanes.length);
  const compact = count <= 4;
  const laneHeight = size.height / count;
  const avatarSize = Math.max(20, Math.min(34, laneHeight - 8));
  const markerWidth = avatarSize + 40;
  const inset = 10;
  const travel = Math.max(0, size.width - markerWidth - inset * 2);

  return <div className="race-world-map-slot"><section className={`race-world-map${compact ? ' race-world-map--compact' : ''}`} aria-label={text('mode')}
    style={{ '--race-capacity': compact ? 4 : 8, '--race-avatar-size': `${avatarSize}px`, '--race-marker-width': `${markerWidth}px` } as CSSProperties}>
    <svg className="race-world-map__land" viewBox="0 0 800 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g>
        {/* Deliberately simplified silhouettes, drawn locally; no borders or remote assets. */}
        <path d="M35 65 57 43 105 34 127 22 166 28 191 44 222 41 237 60 213 79 211 100 191 118 171 122 155 143 134 147 128 169 146 181 159 198 181 204 188 219 173 221 153 207 130 198 113 174 94 158 86 133 64 123 58 100 36 94 20 78Z" />
        <path d="M227 23 260 14 291 29 281 52 258 74 238 62Z" />
        <path d="M183 221 207 211 237 222 258 241 250 265 230 280 223 300 202 331 188 340 183 311 169 287 167 261 153 240 161 224Z" />
        <path d="M355 102 370 83 390 80 393 61 414 40 428 43 420 69 410 85 430 89 444 104 431 117 411 111 405 123 389 119 380 132 359 127Z" />
        <path d="M360 140 391 128 419 137 438 161 463 173 454 191 438 196 424 227 407 256 387 265 374 240 371 216 349 197 338 169Z" />
        <path d="M431 66 455 48 495 46 521 30 554 37 574 27 623 32 647 46 692 43 717 57 754 67 768 86 739 98 719 93 705 114 679 126 670 148 644 154 633 179 612 171 600 150 578 151 564 181 549 204 534 180 529 158 503 146 485 149 472 128 442 122 449 98 430 85Z" />
        <path d="M466 158 490 165 507 189 489 198 468 181Z M612 183 630 193 642 219 631 225 616 210Z M653 230 675 239 697 241 704 251 676 252 655 242Z" />
        <path d="M658 266 686 253 706 262 726 258 744 279 735 305 709 317 686 303 659 307 647 288Z M754 319 766 299 773 302 765 326 751 337 745 334Z" />
        <path d="M457 230 463 244 453 263 447 258Z M723 133 730 144 722 161 715 167 710 160Z M339 82 345 94 339 105 332 98Z" />
      </g>
    </svg>
    <div ref={mapRef} className="race-world-map__lanes" role="list">
      {lanes.map((id, lane) => {
        const member = members.find((item) => item.user_id === id);
        if (!member) return null; // Leave the vacant lane reserved for a reconnect.
        const isLocal = id === currentUserId;
        const value = Math.max(0, Math.min(total, (isLocal ? authoritativeLocal : progress[id]?.progress) || 0));
        const offline = !member.connected || (isLocal && !connected);
        const finished = value >= total;
        const label = `${member.display_name}${isLocal ? ` · ${text('you')}` : ''} · ${value}/${total}${offline ? ` · ${text('disconnected')}` : ''}${finished ? ` · ${text('completed')}` : ''}`;
        return <div key={id} className="race-world-map__lane" role="listitem" data-user-id={id}
          style={{ top: `${(lane + .5) / count * 100}%`, '--race-player-color': colors[lane % colors.length] } as CSSProperties}>
          <div className={`race-world-map__runner${isLocal ? ' race-world-map__runner--local' : ''}${offline ? ' race-world-map__runner--offline' : ''}`}
            style={{ transform: `translate3d(${inset + value / total * travel}px, -50%, 0)` }}>
            <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} title={label}>
              <span className="race-world-map__avatar" aria-hidden="true">
                {member.display_name.slice(0, 1).toUpperCase()}
                {member.avatar_url && <img src={`${apiBaseUrl}${member.avatar_url}`} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
              </span>
              <small aria-hidden="true">{value}/{total}</small>
              {(offline || finished) && <span className="race-world-map__state" aria-hidden="true">{offline ? <WifiOff /> : <Check />}</span>}
            </div>
          </div>
        </div>;
      })}
    </div>
  </section></div>;
});
