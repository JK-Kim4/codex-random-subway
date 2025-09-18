import { useCallback, useEffect, useState } from 'react';
import type { Station } from '../types/subway';

export interface UseRandomStationOptions {
  avoidImmediateRepeat?: boolean;
}

interface UseRandomStationResult {
  currentStation: Station | null;
  drawStation: () => void;
}

export const useRandomStation = (
  stations: Station[],
  { avoidImmediateRepeat = true }: UseRandomStationOptions = {}
): UseRandomStationResult => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);

  const drawStation = useCallback(() => {
    if (stations.length === 0) {
      setCurrentStation(null);
      return;
    }

    setCurrentStation((prev) => {
      if (!avoidImmediateRepeat || stations.length === 1 || !prev) {
        return stations[Math.floor(Math.random() * stations.length)];
      }

      let next = stations[Math.floor(Math.random() * stations.length)];
      const maxAttempts = 5;
      let attempt = 0;

      while (next.id === prev.id && attempt < maxAttempts) {
        next = stations[Math.floor(Math.random() * stations.length)];
        attempt += 1;
      }

      return next.id === prev.id ? prev : next;
    });
  }, [avoidImmediateRepeat, stations]);

  useEffect(() => {
    drawStation();
  }, [drawStation]);

  return { currentStation, drawStation };
};
