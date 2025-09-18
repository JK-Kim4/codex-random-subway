import { useCallback, useEffect, useState } from 'react';
import type { Station } from '../types/subway';

export interface UseRandomStationOptions {
  avoidImmediateRepeat?: boolean;
  autoDrawOnMount?: boolean;
}

interface UseRandomStationResult {
  currentStations: Station[];
  drawStations: (count?: number) => void;
}

const areSelectionsEqual = (a: Station[], b: Station[]) => {
  if (a.length !== b.length) {
    return false;
  }

  const ids = new Set(a.map((station) => station.id));

  if (ids.size !== a.length) {
    return false;
  }

  return b.every((station) => ids.has(station.id));
};

export const useRandomStation = (
  stations: Station[],
  {
    avoidImmediateRepeat = true,
    autoDrawOnMount = true,
  }: UseRandomStationOptions = {},
): UseRandomStationResult => {
  const [currentStations, setCurrentStations] = useState<Station[]>([]);

  const drawStations = useCallback(
    (count = 1) => {
      if (stations.length === 0) {
        setCurrentStations([]);
        return;
      }

      const safeCount = Math.min(Math.max(1, Math.floor(count)), stations.length);

      setCurrentStations((previous) => {
        if (safeCount === 1) {
          if (!avoidImmediateRepeat || stations.length === 1 || previous.length === 0) {
            return [stations[Math.floor(Math.random() * stations.length)]];
          }

          const prevStation = previous[0];
          let next = stations[Math.floor(Math.random() * stations.length)];
          const maxAttempts = 5;
          let attempt = 0;

          while (next.id === prevStation.id && attempt < maxAttempts) {
            next = stations[Math.floor(Math.random() * stations.length)];
            attempt += 1;
          }

          return next.id === prevStation.id ? [prevStation] : [next];
        }

        const pickUniqueSelection = () => {
          const selection: Station[] = [];
          const usedIds = new Set<string>();
          const maxAttempts = stations.length * 3;
          let attempt = 0;

          while (selection.length < safeCount && attempt < maxAttempts) {
            const candidate = stations[Math.floor(Math.random() * stations.length)];
            attempt += 1;

            if (usedIds.has(candidate.id)) {
              continue;
            }

            usedIds.add(candidate.id);
            selection.push(candidate);
          }

          if (selection.length < safeCount) {
            for (const station of stations) {
              if (!usedIds.has(station.id)) {
                selection.push(station);
                usedIds.add(station.id);
              }

              if (selection.length === safeCount) {
                break;
              }
            }
          }

          return selection;
        };

        let nextSelection = pickUniqueSelection();

        if (
          avoidImmediateRepeat &&
          previous.length === nextSelection.length &&
          nextSelection.length > 0 &&
          safeCount < stations.length &&
          areSelectionsEqual(previous, nextSelection)
        ) {
          let attempt = 0;

          while (attempt < 5) {
            const alternative = pickUniqueSelection();

            if (!areSelectionsEqual(previous, alternative)) {
              nextSelection = alternative;
              break;
            }

            attempt += 1;
          }
        }

        return nextSelection;
      });
    },
    [avoidImmediateRepeat, stations],
  );

  useEffect(() => {
    if (autoDrawOnMount) {
      drawStations();
    }
  }, [autoDrawOnMount, drawStations]);

  return { currentStations, drawStations };
};
