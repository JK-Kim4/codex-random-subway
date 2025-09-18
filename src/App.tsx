import { useMemo } from 'react';
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
  const { currentStation, drawStation } = useRandomStation(stations);

  return (
    <div className="app">
      <header className="app__header">
        <h1>랜덤 지하철 역 뽑기</h1>
        <p>
          대한민국의 모든 지하철 역 중에서 오늘의 랜덤 추천 역을 만나보세요. 클릭 한 번으로 새로운 역을 발견할 수
          있습니다.
        </p>
        <p className="app__meta">
          총 <strong>{stations.length}</strong>개 역 정보 수록 · 데이터 버전 {dataset.VERSION}
        </p>
      </header>

      <main className="app__main">
        {currentStation ? (
          <StationCard station={currentStation} />
        ) : (
          <p className="app__placeholder">역 정보를 불러오고 있습니다...</p>
        )}
      </main>

      <footer className="app__footer">
        <button type="button" className="app__button" onClick={drawStation}>
          다른 역 뽑기
        </button>
        <a className="app__data-link" href={dataset.URL} target="_blank" rel="noreferrer">
          데이터 출처 보기
        </a>
      </footer>
    </div>
  );
}

export default App;
