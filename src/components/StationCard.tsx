import type { Station } from '../types/subway';
import './StationCard.css';

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const hasInternationalNames =
    station.englishName || station.chineseName || station.japaneseName;
  const lineLabel = station.lines.length > 0 ? station.lines.join(', ') : '';

  return (
    <article className="station-card">
      <header className="station-card__header">
        <h2 className="station-card__title">
          <span className="station-card__name">{station.name}</span>
          {lineLabel && <span className="station-card__line">({lineLabel})</span>}
        </h2>
      </header>

      {hasInternationalNames && (
        <section className="station-card__names">
          {station.englishName && (
            <p>
              <strong>영문</strong>
              <span>{station.englishName}</span>
            </p>
          )}
          {station.chineseName && (
            <p>
              <strong>한자</strong>
              <span>{station.chineseName}</span>
            </p>
          )}
          {station.japaneseName && (
            <p>
              <strong>일문</strong>
              <span>{station.japaneseName}</span>
            </p>
          )}
        </section>
      )}

      <section className="station-card__meta">
        {station.frCode && (
          <p>
            <strong>역 코드</strong>
            <span>{station.frCode}</span>
          </p>
        )}
        <p>
          <strong>위치</strong>
          <span>
            {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
          </span>
        </p>
      </section>
    </article>
  );
}

export default StationCard;
