import { useEffect, useRef, useState } from 'react'
import './NaverMap.css'

type NaverLatLng = {
  lat(): number
  lng(): number
}

type NaverMapInstance = {
  setCenter(latLng: NaverLatLng): void
  setZoom?(zoom: number): void
}

type NaverMarkerInstance = {
  setPosition(latLng: NaverLatLng): void
  setMap?(map: NaverMapInstance | null): void
  setTitle?(title: string): void
}

type NaverMapOptions = {
  center: NaverLatLng
  zoom?: number
  [key: string]: unknown
}

type NaverMarkerOptions = {
  position: NaverLatLng
  map?: NaverMapInstance | null
  title?: string
  [key: string]: unknown
}

type NaverMapsAPI = {
  Map: new (element: HTMLElement, options: NaverMapOptions) => NaverMapInstance
  LatLng: new (latitude: number, longitude: number) => NaverLatLng
  Marker: new (options: NaverMarkerOptions) => NaverMarkerInstance
}

declare global {
  interface Window {
    naver?: {
      maps?: NaverMapsAPI
    }
  }
}

const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID
const NAVER_MAP_SCRIPT_ID = import.meta.env.VITE_NAVER_MAP_SCRIPT_ID
let naverMapsLoader: Promise<NaverMapsAPI> | null = null

function loadNaverMaps(): Promise<NaverMapsAPI> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('브라우저 환경에서만 네이버 지도를 사용할 수 있습니다.')
    )
  }

  if (window.naver?.maps) {
    return Promise.resolve(window.naver.maps)
  }

  if (naverMapsLoader) {
    return naverMapsLoader
  }

  if (!NAVER_MAP_CLIENT_ID) {
    return Promise.reject(
      new Error('네이버 지도 클라이언트 ID가 설정되지 않았습니다.')
    )
  }

  naverMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      NAVER_MAP_SCRIPT_ID
    ) as HTMLScriptElement | null

    const handleLoad = () => {
      if (window.naver?.maps) {
        resolve(window.naver.maps)
      } else {
        naverMapsLoader = null
        reject(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'))
      }
    }

    const handleError = (target?: HTMLScriptElement) => {
      if (target) {
        target.remove()
      }
      naverMapsLoader = null
      reject(new Error('네이버 지도 SDK 로드 중 오류가 발생했습니다.'))
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true })
      existingScript.addEventListener(
        'error',
        () => handleError(existingScript),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.id = NAVER_MAP_SCRIPT_ID
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      NAVER_MAP_CLIENT_ID
    )}`
    script.async = true
    script.defer = true
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        handleLoad()
      },
      { once: true }
    )
    script.addEventListener('error', () => handleError(script), {
      once: true,
    })

    document.head.appendChild(script)
  })

  return naverMapsLoader
}

interface NaverMapProps {
  latitude: number
  longitude: number
  zoom?: number
  markerLabel?: string
  height?: number | string
  className?: string
  ariaLabel?: string
}

export function NaverMap({
  latitude,
  longitude,
  zoom = 16,
  markerLabel,
  height = 240,
  className,
  ariaLabel,
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<NaverMapInstance | null>(null)
  const markerInstanceRef = useRef<NaverMarkerInstance | null>(null)
  const [hasEnteredView, setHasEnteredView] = useState(false)
  const [mapsApi, setMapsApi] = useState<NaverMapsAPI | null>(null)
  const [isScriptLoading, setIsScriptLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const target = containerRef.current

    if (!target || typeof window === 'undefined') {
      return
    }

    if (!('IntersectionObserver' in window)) {
      setHasEnteredView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasEnteredView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px 0px' }
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasEnteredView || mapsApi) {
      return
    }

    let cancelled = false
    setIsScriptLoading(true)

    loadNaverMaps()
      .then((api) => {
        if (cancelled) {
          return
        }
        setMapsApi(api)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return
        }
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('지도를 불러오는 중 오류가 발생했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsScriptLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasEnteredView, mapsApi])

  useEffect(() => {
    if (!mapsApi || !containerRef.current) {
      return
    }

    const mapContainer = containerRef.current
    const position = new mapsApi.LatLng(latitude, longitude)

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new mapsApi.Map(mapContainer, {
        center: position,
        zoom,
      })
    } else {
      mapInstanceRef.current.setCenter(position)
      if (typeof zoom === 'number' && mapInstanceRef.current.setZoom) {
        mapInstanceRef.current.setZoom(zoom)
      }
    }

    if (!markerInstanceRef.current) {
      markerInstanceRef.current = new mapsApi.Marker({
        position,
        map: mapInstanceRef.current,
        title: markerLabel,
      })
    } else {
      markerInstanceRef.current.setPosition(position)
      if (markerLabel && markerInstanceRef.current.setTitle) {
        markerInstanceRef.current.setTitle(markerLabel)
      }
    }
  }, [latitude, longitude, zoom, markerLabel, mapsApi])

  useEffect(() => {
    return () => {
      if (markerInstanceRef.current?.setMap) {
        markerInstanceRef.current.setMap(null)
      }
      markerInstanceRef.current = null
      mapInstanceRef.current = null
    }
  }, [])

  const resolvedHeight =
    typeof height === 'number' ? `${height}px` : height || '240px'
  const mapClassName = ['naver-map', className].filter(Boolean).join(' ')
  const shouldShowStatus = isScriptLoading || !!error
  const statusMessage = error ?? '지도를 불러오는 중입니다...'

  return (
    <div
      className={mapClassName}
      style={{ height: resolvedHeight }}
      aria-label={ariaLabel}
      role={ariaLabel ? 'region' : undefined}
    >
      <div
        ref={containerRef}
        className='naver-map__canvas'
        style={{ height: resolvedHeight }}
        aria-hidden={shouldShowStatus}
      />
      {shouldShowStatus && (
        <div
          className={`naver-map__status${
            error ? ' naver-map__status--error' : ''
          }`}
          role={error ? 'alert' : 'status'}
        >
          {statusMessage}
        </div>
      )}
    </div>
  )
}

export default NaverMap
