import type { Station } from '../types/subway';
import './StationCard.css';

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const hasInternationalNames =
    station.englishName || station.chineseName || station.japaneseName;
  const uniqueLines = Array.from(new Set(station.lines));
  const hasLines = uniqueLines.length > 0;

  return (
    <article className="station-card">
      <header className="station-card__header">
        <div className="station-card__title-row">
          <h2 className="station-card__title">{station.name}</h2>
          {hasLines && (
            <div className="station-card__line-group" aria-label="지나는 노선">
              {uniqueLines.map((line) => (
                <span key={line} className="station-card__line-chip">
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
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
