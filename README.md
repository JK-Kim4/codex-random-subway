# 랜덤 지하철 역 뽑기

대한민국의 지하철 역 데이터를 기반으로 한 번의 클릭으로 무작위 역을 추천해 주는 리액트 웹 애플리케이션입니다.

## 주요 기능
- `subway.json` 데이터셋을 활용한 전 역 랜덤 추천
- 역명, 노선, 다국어 표기, 위도/경도 등 핵심 정보 표시
- 연속된 같은 역 추첨 방지 옵션(기본 활성화)
- 데이터 출처 링크 제공

## 개발 환경
- Vite + React + TypeScript
- ESLint, Vitest 설정 포함

## 실행 방법
```bash
npm install
npm run dev
```

## 환경 변수 설정

네이버 지도 API를 사용하려면 프로젝트 루트에 있는 `.env.example`을 참고하여 `.env` 파일을 생성하고 발급받은 클라이언트 ID를 입력하세요.

```bash
cp .env.example .env
# .env 파일을 열어 실제 발급받은 키로 값을 바꿔주세요
VITE_NAVER_MAP_CLIENT_ID=실제-네이버-지도-클라이언트-ID
```

지도 키는 가능하면 사용 도메인을 제한하여 관리하고, 배포 환경에서도 동일한 환경 변수를 주입해야 합니다.

## 프로덕션 빌드
```bash
npm run build
npm run preview
```
