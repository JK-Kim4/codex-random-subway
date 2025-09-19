import type { Station } from '../types/subway';
import { NaverMap } from './NaverMap';
import './StationCard.css';

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const hasInternationalNames =
    station.englishName || station.chineseName || station.japaneseName;
  const uniqueLines = Array.from(new Set(station.lines));
  const hasLines = uniqueLines.length > 0;
  const hasCoordinates =
    Number.isFinite(station.latitude) && Number.isFinite(station.longitude);
  const trimmedStationName = station.name.trim();
  const stationNameWithSuffix = trimmedStationName.endsWith('역')
    ? trimmedStationName
    : `${trimmedStationName}역`;
  const googleSearchQuery = `${stationNameWithSuffix} 주변 맛집`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    googleSearchQuery,
  )}`;
  const formattedCoordinates = hasCoordinates
    ? `${station.latitude.toFixed(6)}, ${station.longitude.toFixed(6)}`
    : '위치 정보를 불러올 수 없습니다';

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
          <span>{formattedCoordinates}</span>
        </p>
      </section>
      {hasCoordinates && (
        <div className="station-card__map">
          <NaverMap
            latitude={station.latitude}
            longitude={station.longitude}
            markerLabel={station.name}
            ariaLabel={`${station.name} 위치 지도`}
          />
          <div className="station-card__actions">
            <a
              className="station-card__search-link"
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`구글에서 ${googleSearchQuery} 검색`}
            >
              구글에서 {googleSearchQuery} 검색하기
              <span aria-hidden="true" className="station-card__search-link-icon">
                →
              </span>
            </a>
          </div>
        </div>
      )}
    </article>
  );
}

export default StationCard;
