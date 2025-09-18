import { useEffect, useMemo, useRef, useState } from 'react';
import StationCard from './components/StationCard';
import subwayRaw from './assets/subway.json';
import { useRandomStation } from './hooks/useRandomStation';
import type { RawStation, RawSubwayData, Station } from './types/subway';
import './styles/App.css';

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

  return Array.from(stationMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'ko')
  );
};

function App() {
  const dataset = subwayRaw as RawSubwayData;

  const stations = useMemo(() => buildStationList(dataset), [dataset]);
  const { currentStation, drawStation } = useRandomStation(stations, {
    autoDrawOnMount: false,
  });
  const [hasStarted, setHasStarted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayedStation, setDisplayedStation] = useState<Station | null>(null);
  const latestStationRef = useRef<Station | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestStationRef.current = currentStation;
  }, [currentStation]);

  useEffect(() => () => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }
  }, []);

  const handleDraw = () => {
    if (stations.length === 0) {
      return;
    }

    setHasStarted(true);
    setIsDrawing(true);
    setDisplayedStation(null);
    drawStation();

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = setTimeout(() => {
      setDisplayedStation(latestStationRef.current ?? null);
      setIsDrawing(false);
    }, 900);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>랜덤 지하철 역 뽑기</h1>
        <p>
          노선도 위에서 손가락이 방황하는 날, 대신 버튼을 눌러 오늘의 행선지를 추천받아보세요. 어쩌면 집 앞 역이
          다시 나올지도, 전혀 가보지 못한 곳이 나올지도 몰라요.
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
              역 뽑기 버튼을 누르면 잠깐의 셔플 끝에 추천 역이 등장합니다. 마음속에서 &ldquo;이번엔 어디쯤일까?&rdquo;라는
              설렘이 피어오를 거예요.
            </p>
            <p className="app__intro-note">자, 준비되셨다면 버튼을 눌러 랜덤 여정을 시작해볼까요?</p>
          </section>
        )}

        {hasStarted && isDrawing && (
          <section className="app__drawing">
            <div className="app__drawing-spinner" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>잠시만요! 오늘의 행선지를 섞는 중입니다...</p>
          </section>
        )}

        {hasStarted && !isDrawing && displayedStation && (
          <div className="app__station-wrapper">
            <StationCard station={displayedStation} />
          </div>
        )}

        {hasStarted && !isDrawing && !displayedStation && (
          <p className="app__placeholder">추천할 역을 찾지 못했어요. 다시 시도해 주세요.</p>
        )}
      </main>

      <footer className="app__footer">
        <button
          type="button"
          className="app__button"
          onClick={handleDraw}
          disabled={isDrawing || stations.length === 0}
        >
          {hasStarted ? '다른 역 뽑기' : '오늘의 역 뽑기'}
        </button>
        <a className="app__data-link" href={dataset.URL} target="_blank" rel="noreferrer">
          데이터 출처 보기
        </a>
      </footer>
    </div>
  );
}

export default App;
