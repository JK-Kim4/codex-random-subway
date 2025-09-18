import {
  type CSSProperties,
  type KeyboardEvent,
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import StationCard from './components/StationCard';
import subwayRaw from './assets/subway.json';
import { useRandomStation } from './hooks/useRandomStation';
import type { RawStation, RawSubwayData, Station } from './types/subway';
import './styles/App.css';

const MIN_DRAW_COUNT = 1;
const MAX_DRAW_COUNT = 5;

const toStationKey = (station: RawStation) => station.station_cd ?? `${station.line}-${station.name}`;

const buildStationList = (data: RawSubwayData): Station[] => {
  const stationMap = new Map<string, Station>();

  data.DATA.forEach((line) => {
    line.node.forEach((edge) => {
      edge.station.forEach((rawStation) => {
        const id = toStationKey(rawStation);
        const existing = stationMap.get(id);

        if (existing) {
          const lines = existing.lines.includes(rawStation.line)
            ? existing.lines
            : [...existing.lines, rawStation.line];

          stationMap.set(id, {
            ...existing,
            lines,
            englishName: existing.englishName ?? rawStation.station_nm_eng,
            chineseName: existing.chineseName ?? rawStation.station_nm_chn,
            japaneseName: existing.japaneseName ?? rawStation.station_nm_jpn,
            frCode: existing.frCode ?? rawStation.fr_code,
            latitude: existing.latitude ?? rawStation.lat,
            longitude: existing.longitude ?? rawStation.lng,
          });
        } else {
          stationMap.set(id, {
            id,
            name: rawStation.name,
            lines: [rawStation.line],
            englishName: rawStation.station_nm_eng,
            chineseName: rawStation.station_nm_chn,
            japaneseName: rawStation.station_nm_jpn,
            frCode: rawStation.fr_code,
            latitude: rawStation.lat,
            longitude: rawStation.lng,
          });
        }
      });
    });
  });

  return Array.from(stationMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
};

function App() {
  const dataset = subwayRaw as unknown as RawSubwayData;

  const stations = useMemo(() => buildStationList(dataset), [dataset]);
  const maxSelectable = Math.max(MIN_DRAW_COUNT, Math.min(MAX_DRAW_COUNT, stations.length || MIN_DRAW_COUNT));
  const { currentStations, drawStations } = useRandomStation(stations, {
    autoDrawOnMount: false,
  });

  const [drawCount, setDrawCount] = useState<number>(MIN_DRAW_COUNT);
  const [activeDrawCount, setActiveDrawCount] = useState<number>(MIN_DRAW_COUNT);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayedStations, setDisplayedStations] = useState<Station[]>([]);
  const [activeStationIndex, setActiveStationIndex] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState<Station[]>([]);
  const latestStationsRef = useRef<Station[]>([]);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clampCount = useCallback(
    (value: number) => {
      const floored = Number.isFinite(value) ? Math.floor(value) : MIN_DRAW_COUNT;
      return Math.min(Math.max(MIN_DRAW_COUNT, floored), maxSelectable);
    },
    [maxSelectable],
  );

  const generatePreview = useCallback(
    (count: number) => {
      if (stations.length === 0) {
        return [];
      }

      const safeCount = Math.min(Math.max(MIN_DRAW_COUNT, count), stations.length);
      const usedIds = new Set<string>();
      const preview: Station[] = [];
      const maxAttempts = stations.length * 2;
      let attempt = 0;

      while (preview.length < safeCount && attempt < maxAttempts) {
        const candidate = stations[Math.floor(Math.random() * stations.length)];
        attempt += 1;

        if (usedIds.has(candidate.id)) {
          continue;
        }

        usedIds.add(candidate.id);
        preview.push(candidate);
      }

      if (preview.length < safeCount) {
        for (const station of stations) {
          if (!usedIds.has(station.id)) {
            preview.push(station);
            usedIds.add(station.id);
          }

          if (preview.length === safeCount) {
            break;
          }
        }
      }

      return preview;
    },
    [stations],
  );

  useEffect(() => {
    latestStationsRef.current = currentStations;
  }, [currentStations]);

  const clearPreviewInterval = () => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }

      clearPreviewInterval();
    },
    [],
  );

  useEffect(() => {
    setDrawCount((prev) => clampCount(prev));
  }, [clampCount]);

  const handleCountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);

    if (Number.isNaN(nextValue)) {
      setDrawCount(MIN_DRAW_COUNT);
      return;
    }

    setDrawCount(clampCount(nextValue));
  };

  const adjustCount = (delta: number) => {
    setDrawCount((prev) => clampCount(prev + delta));
  };

  const handleDraw = () => {
    if (stations.length === 0) {
      return;
    }

    const nextCount = clampCount(drawCount);
    const initialPreview = generatePreview(nextCount);

    setHasStarted(true);
    setDisplayedStations([]);
    setActiveStationIndex(0);
    setActiveDrawCount(nextCount);
    setLoadingPreview(initialPreview);
    setIsDrawing(true);
    drawStations(nextCount);

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    clearPreviewInterval();

    previewIntervalRef.current = setInterval(() => {
      setLoadingPreview(generatePreview(nextCount));
    }, 140);

    revealTimeoutRef.current = setTimeout(() => {
      setDisplayedStations(latestStationsRef.current);
      setIsDrawing(false);
      clearPreviewInterval();
      setLoadingPreview([]);
    }, 1600);
  };

  const currentButtonLabel = hasStarted
    ? activeDrawCount > 1
      ? '다른 역들 다시 뽑기'
      : '다른 역 다시 뽑기'
    : '오늘의 역 뽑기';

  const handlePreviousStation = () => {
    if (displayedStations.length <= 1) {
      return;
    }

    setActiveStationIndex((prev) => (prev === 0 ? displayedStations.length - 1 : prev - 1));
  };

  const handleNextStation = () => {
    if (displayedStations.length <= 1) {
      return;
    }

    setActiveStationIndex((prev) => (prev === displayedStations.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    setActiveStationIndex(0);
  }, [displayedStations]);

  const handleSelectStation = (index: number) => {
    setActiveStationIndex(index);
  };

  const handleCarouselKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (displayedStations.length <= 1) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePreviousStation();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNextStation();
    }
  };

  const hasResults = displayedStations.length > 0;

  return (
    <div className="app">
      <header className="app__header">
        <h1>랜덤 지하철 역 뽑기</h1>
        <p>
          노선도 위에서 손가락이 방황하는 날, 대신 버튼을 눌러 오늘의 행선지를 추천받아보세요. 어쩌면 집 앞 역이 다시
          나올지도, 전혀 가보지 못한 곳이 나올지도 몰라요.
        </p>
        <p>
          원하는 개수만큼 동시에 추첨해보세요. 순간 번쩍이는 추첨 보드가 오늘의 후보들을 신나게 섞어 드립니다.
        </p>
        <p className="app__meta">
          총 <strong>{stations.length}</strong>개 역 정보 수록 · 데이터 버전 {dataset.VERSION}
        </p>
      </header>

      <main className="app__main" aria-live="polite">
        {!hasStarted && (
          <section className="app__intro">
            <p>오늘은 어떤 역이 기다리고 있을까요? 무작정 떠나고 싶은 마음에 노선도를 덮어놓았습니다.</p>
            <p>
              이제는 한 번에 여러 역을 추천받을 수 있어요. 뽑을 개수를 정하고 버튼을 누르면, 추첨 보드가 분주하게
              이름표를 뒤섞기 시작합니다.
            </p>
            <p className="app__intro-note">자, 준비되셨다면 버튼을 눌러 랜덤 여정을 시작해볼까요?</p>
          </section>
        )}

        {hasStarted && isDrawing && (
          <section className="app__drawing" aria-label="랜덤 역 추첨 진행 중">
            <div className="app__drawing-board" aria-hidden="true">
              {(loadingPreview.length > 0 ? loadingPreview : generatePreview(activeDrawCount)).map((previewStation, index) => (
                <div
                  key={`${previewStation.id}-${index}`}
                  className="app__drawing-slot"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="app__drawing-slot-order">#{index + 1}</span>
                  <strong>{previewStation.name}</strong>
                  <small>{previewStation.lines.join(', ')}</small>
                </div>
              ))}
            </div>
            <p>잠시만요! {activeDrawCount}개의 행선지를 셔플 중입니다...</p>
          </section>
        )}

        {hasStarted && !isDrawing && hasResults && (
          <section className="app__results">
            <p className="app__results-title">
              오늘의 추천 역{displayedStations.length > 1 ? ` ${displayedStations.length}곳` : ''}입니다!
            </p>
            <div className="app__results-carousel">
              <div className="app__carousel-stage" role="group" aria-label="추천된 역 목록">
                {displayedStations.map((station, index) => {
                  const offset = index - activeStationIndex;
                  const distance = Math.abs(offset);
                  const direction = Math.sign(offset);
                  const translatePercent = direction === 0 ? 0 : direction * Math.min(distance * 36, 96);
                  const scale = index === activeStationIndex ? 1 : Math.max(0.82, 1 - Math.min(distance, 2) * 0.08);
                  const opacity = index === activeStationIndex ? 1 : Math.max(0.2, 1 - distance * 0.32);
                  const cardStyle: CSSProperties = {
                    transform: `translateX(${translatePercent}%) scale(${scale})`,
                    opacity,
                    zIndex: Math.max(1, displayedStations.length - distance),
                  };
                  const ariaLabel = station.lines.length
                    ? `${station.name} (${station.lines.join(', ')}) 역 자세히 보기`
                    : `${station.name} 역 자세히 보기`;

                  return (
                    <button
                      key={station.id}
                      type="button"
                      className={`app__carousel-card${index === activeStationIndex ? ' app__carousel-card--active' : ''}`}
                      onClick={() => handleSelectStation(index)}
                      aria-label={ariaLabel}
                      aria-current={index === activeStationIndex ? 'true' : undefined}
                      onKeyDown={handleCarouselKeyDown}
                      style={cardStyle}
                    >
                      <StationCard station={station} />
                    </button>
                  );
                })}
              </div>
            </div>
            {displayedStations.length > 1 && (
              <p className="app__results-indicator" aria-live="polite">
                {activeStationIndex + 1} / {displayedStations.length}
              </p>
            )}
          </section>
        )}

        {hasStarted && !isDrawing && displayedStations.length === 0 && (
          <p className="app__placeholder">추천할 역을 찾지 못했어요. 다시 시도해 주세요.</p>
        )}
      </main>

      <footer className="app__footer">
        <div className="app__count-control">
          <label htmlFor="station-count">한 번에 뽑을 역 개수</label>
          <div className="app__count-field">
            <button
              type="button"
              className="app__count-button"
              onClick={() => adjustCount(-1)}
              disabled={isDrawing || drawCount <= MIN_DRAW_COUNT}
            >
              −
            </button>
            <input
              id="station-count"
              type="number"
              min={MIN_DRAW_COUNT}
              max={maxSelectable}
              value={drawCount}
              onChange={handleCountChange}
              disabled={isDrawing}
              className="app__count-input"
              inputMode="numeric"
              aria-label="한 번에 뽑을 역 개수"
            />
            <button
              type="button"
              className="app__count-button"
              onClick={() => adjustCount(1)}
              disabled={isDrawing || drawCount >= maxSelectable}
            >
              +
            </button>
          </div>
          <p className="app__count-hint">최대 {maxSelectable}개까지 한 번에 추첨할 수 있어요.</p>
        </div>

        <button
          type="button"
          className="app__button"
          onClick={handleDraw}
          disabled={isDrawing || stations.length === 0}
        >
          {currentButtonLabel}
        </button>
        <a className="app__data-link" href={dataset.URL} target="_blank" rel="noreferrer">
          데이터 출처 보기
        </a>
      </footer>
    </div>
  );
}

export default App;
