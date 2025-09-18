export interface RawStation {
  line: string;
  name: string;
  station_nm_chn?: string;
  station_nm_jpn?: string;
  station_nm_eng?: string;
  fr_code?: string;
  station_cd: string;
  bldn_id?: string;
  lat: number;
  lng: number;
}

export interface RawEdge {
  station: RawStation[];
  via: [number, number][];
}

export interface RawSubwayData {
  VERSION: string;
  URL: string;
  REFERENCE: Record<string, string>;
  DESCRIPTION: Record<string, unknown>;
  DATA: RawEdge[];
}

export interface Station {
  id: string;
  name: string;
  lines: string[];
  englishName?: string;
  chineseName?: string;
  japaneseName?: string;
  frCode?: string;
  latitude: number;
  longitude: number;
}
