/**
 * 네이버 장소/주소 검색
 * - 우선: 네이버 클라우드 지도 Geocoding (주소)
 * - 보조: 네이버 개발자센터 지역 검색 (상호명)
 * 키 없거나 웹 CORS 등으로 실패하면 데모 결과로 대체합니다.
 *
 * .env
 * EXPO_PUBLIC_NCP_MAP_CLIENT_ID=
 * EXPO_PUBLIC_NCP_MAP_CLIENT_SECRET=
 * EXPO_PUBLIC_NAVER_CLIENT_ID=
 * EXPO_PUBLIC_NAVER_CLIENT_SECRET=
 */

export type NaverPlaceResult = {
  title: string;
  address: string;
  roadAddress?: string;
  mapx?: string;
  mapy?: string;
  source: 'ncp-geocode' | 'naver-local' | 'demo';
};

type SearchOutcome = {
  items: NaverPlaceResult[];
  mode: 'live' | 'demo';
  message?: string;
};

const DEMO_PLACES: NaverPlaceResult[] = [
  {
    title: '강남 스터디카페',
    address: '서울특별시 강남구 역삼동 826-37',
    roadAddress: '서울특별시 강남구 테헤란로 152',
    mapx: '1270364780',
    mapy: '375001564',
    source: 'demo',
  },
  {
    title: '연남 카페 모모',
    address: '서울특별시 마포구 연남동 227-6',
    roadAddress: '서울특별시 마포구 연남로 12',
    mapx: '1269220000',
    mapy: '375660000',
    source: 'demo',
  },
  {
    title: '홍대입구역 스터디룸',
    address: '서울특별시 마포구 서교동 477-5',
    roadAddress: '서울특별시 마포구 양화로 188',
    mapx: '1269238000',
    mapy: '375566000',
    source: 'demo',
  },
  {
    title: '선릉 공유오피스',
    address: '서울특별시 강남구 대치동 942-1',
    roadAddress: '서울특별시 강남구 테헤란로 521',
    mapx: '1270489000',
    mapy: '375044000',
    source: 'demo',
  },
  {
    title: '서울도서관',
    address: '서울특별시 중구 세종대로 110',
    roadAddress: '서울특별시 중구 세종대로 110',
    mapx: '1269780000',
    mapy: '375665000',
    source: 'demo',
  },
];

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
}

function getNcpKeys() {
  return {
    id: process.env.EXPO_PUBLIC_NCP_MAP_CLIENT_ID?.trim() ?? '',
    secret: process.env.EXPO_PUBLIC_NCP_MAP_CLIENT_SECRET?.trim() ?? '',
  };
}

function getNaverKeys() {
  return {
    id: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID?.trim() ?? '',
    secret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET?.trim() ?? '',
  };
}

export function hasNaverMapKeys() {
  const ncp = getNcpKeys();
  const naver = getNaverKeys();
  return Boolean((ncp.id && ncp.secret) || (naver.id && naver.secret));
}

function demoSearch(query: string): NaverPlaceResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_PLACES.slice(0, 3);
  const hit = DEMO_PLACES.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.roadAddress ?? '').toLowerCase().includes(q),
  );
  if (hit.length > 0) return hit;
  return [
    {
      title: query.trim(),
      address: `${query.trim()} (직접 입력 · 데모)`,
      roadAddress: query.trim(),
      source: 'demo',
    },
    ...DEMO_PLACES.slice(0, 2),
  ];
}

async function searchNcpGeocode(query: string): Promise<NaverPlaceResult[]> {
  const { id, secret } = getNcpKeys();
  if (!id || !secret) return [];

  const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}&count=8`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-ncp-apigw-api-key-id': id,
      'x-ncp-apigw-api-key': secret,
    },
  });
  if (!res.ok) {
    throw new Error(`NCP geocode ${res.status}`);
  }
  const data = (await res.json()) as {
    addresses?: Array<{
      roadAddress?: string;
      jibunAddress?: string;
      x?: string;
      y?: string;
    }>;
  };
  return (data.addresses ?? []).map((a) => ({
    title: a.roadAddress || a.jibunAddress || query,
    address: a.jibunAddress || a.roadAddress || query,
    roadAddress: a.roadAddress || undefined,
    mapx: a.x,
    mapy: a.y,
    source: 'ncp-geocode' as const,
  }));
}

async function searchNaverLocal(query: string): Promise<NaverPlaceResult[]> {
  const { id, secret } = getNaverKeys();
  if (!id || !secret) return [];

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=8`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': id,
      'X-Naver-Client-Secret': secret,
    },
  });
  if (!res.ok) {
    throw new Error(`Naver local ${res.status}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      title: string;
      address: string;
      roadAddress?: string;
      mapx?: string;
      mapy?: string;
    }>;
  };
  return (data.items ?? []).map((item) => ({
    title: stripHtml(item.title),
    address: item.address,
    roadAddress: item.roadAddress || undefined,
    mapx: item.mapx,
    mapy: item.mapy,
    source: 'naver-local' as const,
  }));
}

export async function searchNaverPlaces(query: string): Promise<SearchOutcome> {
  const q = query.trim();
  if (q.length < 1) {
    return { items: [], mode: 'demo', message: '검색어를 입력해 주세요.' };
  }

  const errors: string[] = [];

  try {
    const local = await searchNaverLocal(q);
    if (local.length > 0) {
      return { items: local, mode: 'live' };
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'local failed');
  }

  try {
    const geo = await searchNcpGeocode(q);
    if (geo.length > 0) {
      return { items: geo, mode: 'live' };
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'geocode failed');
  }

  const demo = demoSearch(q);
  if (!hasNaverMapKeys()) {
    return {
      items: demo,
      mode: 'demo',
      message: '네이버 API 키가 없어 데모 검색으로 보여요. .env에 키를 넣으면 실제 검색이 됩니다.',
    };
  }
  return {
    items: demo,
    mode: 'demo',
    message:
      errors.length > 0
        ? '네이버 API 호출에 실패해 데모 결과로 대체했어요. (웹 CORS 또는 키 권한 확인)'
        : '검색 결과가 없어 데모 후보를 보여요.',
  };
}
