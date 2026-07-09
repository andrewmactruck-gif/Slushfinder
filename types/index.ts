// ── Distance units ────────────────────────────────────────
export type DistanceUnit = 'km' | 'mi'

// Countries that default to miles
export const MILES_COUNTRIES = new Set(['US', 'GB', 'LR', 'MM'])

export function detectUnit(countryCode?: string): DistanceUnit {
  if (!countryCode) return 'km'
  return MILES_COUNTRIES.has(countryCode.toUpperCase()) ? 'mi' : 'km'
}

export function kmToMi(km: number): number {
  return km * 0.621371
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === 'mi') return `${kmToMi(km).toFixed(1)} mi`
  return `${km.toFixed(1)} km`
}

// ── Machine status ────────────────────────────────────────
export type MachineStatus = 'operational' | 'issue_reported' | 'removed'

// ── Brands (global) ──────────────────────────────────────
export type Brand =
  | '7-Eleven'
  | 'Circle K'
  | 'Couche-Tard'
  | 'ICEE'
  | 'Slush Puppie'
  | 'Slurpee'
  | 'Frosty'
  | 'Slurpee Japan'
  | 'Icee UK'
  | 'Froster'
  | 'Other'

export const ALL_BRANDS: Brand[] = [
  '7-Eleven', 'Circle K', 'Couche-Tard', 'ICEE', 'Slush Puppie',
  'Slurpee', 'Frosty', 'Slurpee Japan', 'Icee UK', 'Froster', 'Other',
]

export const BRAND_DISPLAY: Record<Brand, string> = {
  '7-Eleven':     '7-Eleven (Slurpee)',
  'Circle K':     'Circle K (Froster / Frozen)',
  'Couche-Tard':  'Couche-Tard (Sloche)',
  'ICEE':         'ICEE Machine',
  'Slush Puppie': 'Slush Puppie',
  'Slurpee':      'Slurpee (Generic)',
  'Frosty':       'Frosty / Frozen Drink',
  'Slurpee Japan':'Slurpee Japan (スラーピー)',
  'Icee UK':      'ICEE UK',
  'Froster':      'Froster',
  'Other':        'Other / Independent',
}

export const BRAND_COLORS: Record<Brand, { bg: string; text: string }> = {
  '7-Eleven':     { bg: 'bg-cyan-900/40',   text: 'text-cyan-300' },
  'Circle K':     { bg: 'bg-orange-900/40', text: 'text-orange-300' },
  'Couche-Tard':  { bg: 'bg-pink-900/40',   text: 'text-pink-300' },
  'ICEE':         { bg: 'bg-purple-900/40', text: 'text-purple-300' },
  'Slush Puppie': { bg: 'bg-yellow-900/40', text: 'text-yellow-300' },
  'Slurpee':      { bg: 'bg-cyan-900/40',   text: 'text-cyan-300' },
  'Frosty':       { bg: 'bg-blue-900/40',   text: 'text-blue-300' },
  'Slurpee Japan':{ bg: 'bg-red-900/40',    text: 'text-red-300' },
  'Icee UK':      { bg: 'bg-blue-900/40',   text: 'text-blue-300' },
  'Froster':      { bg: 'bg-orange-900/40', text: 'text-orange-300' },
  'Other':        { bg: 'bg-slate-800',      text: 'text-slate-300' },
}

// ── Hours ─────────────────────────────────────────────────
export interface DayHours {
  open: string | null
  close: string | null
}

export interface WeekHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

// ── Core location ─────────────────────────────────────────
export interface Location {
  id: string
  name: string
  address: string
  city: string
  region: string        // state/province/county
  postal_code: string
  country_code: string  // ISO 3166-1 alpha-2 e.g. "CA", "US", "GB", "JP"
  country_name: string
  latitude: number
  longitude: number
  timezone: string
  brand: Brand
  machine_status: MachineStatus
  hours: WeekHours
  flavours: string | null
  notes: string | null
  phone: string | null
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface LocationWithDistance extends Location {
  distance_km: number
  is_open: boolean
  todays_hours: string
}

// ── Search ────────────────────────────────────────────────
export interface SearchParams {
  lat: number
  lng: number
  radius_km: number
  brand?: Brand
  open_now?: boolean
  country_code?: string
}

export interface SearchResult {
  locations: LocationWithDistance[]
  total: number
  search_center: { lat: number; lng: number }
  radius_km: number
  query_label?: string
  country_detected?: string
}

// ── Submission ────────────────────────────────────────────
export interface SubmitLocationPayload {
  name: string
  address: string
  city: string
  region: string
  postal_code: string
  country_code: string
  country_name: string
  brand: Brand
  notes?: string
  flavours?: string
  machine_condition?: string
}

// ── i18n strings (minimal, browser-detected) ─────────────
export type LangCode = 'en' | 'fr' | 'es' | 'de' | 'ja' | 'pt' | 'it' | 'nl' | 'ko' | 'zh'

export interface Strings {
  findFrequency: string
  subtitle: string
  searchPlaceholder: string
  useLocation: string
  within: string
  openNow: string
  getDirections: string
  addStation: string
  noMachines: string
  operational: string
  issueReported: string
  openNowLabel: string
  closedLabel: string
  storeHours: string
  machineCondition: string
  availableFlavours: string
  reportIssue: string
  submitStation: string
  nearby: string
  foundNearby: string
  today: string
  verified: string
  kmLabel: string
  miLabel: string
}

export const TRANSLATIONS: Record<LangCode, Strings> = {
  en: {
    findFrequency: 'Find your frequency.',
    subtitle: 'Discover slushy machines anywhere in the world.',
    searchPlaceholder: 'Postcode, ZIP, or city…',
    useLocation: 'Use my current location',
    within: 'Within',
    openNow: 'Open now',
    getDirections: 'Get directions',
    addStation: 'Add a station',
    noMachines: 'No machines found nearby.',
    operational: 'Operational',
    issueReported: 'Issue reported',
    openNowLabel: 'Open now',
    closedLabel: 'Closed',
    storeHours: 'Store hours',
    machineCondition: 'Machine condition',
    availableFlavours: 'Available flavours',
    reportIssue: 'Report an issue',
    submitStation: 'Submit station',
    nearby: 'Nearby Slushy Spots',
    foundNearby: 'found nearby',
    today: 'today',
    verified: 'Verified',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  fr: {
    findFrequency: 'Trouvez votre fréquence.',
    subtitle: 'Découvrez des machines à slush partout dans le monde.',
    searchPlaceholder: 'Code postal ou ville…',
    useLocation: 'Utiliser ma position',
    within: 'Dans un rayon de',
    openNow: 'Ouvert maintenant',
    getDirections: 'Itinéraire',
    addStation: 'Ajouter une station',
    noMachines: 'Aucune machine trouvée.',
    operational: 'Opérationnel',
    issueReported: 'Problème signalé',
    openNowLabel: 'Ouvert',
    closedLabel: 'Fermé',
    storeHours: 'Heures d\'ouverture',
    machineCondition: 'État de la machine',
    availableFlavours: 'Saveurs disponibles',
    reportIssue: 'Signaler un problème',
    submitStation: 'Soumettre',
    nearby: 'Slush à proximité',
    foundNearby: 'trouvé(s) à proximité',
    today: 'aujourd\'hui',
    verified: 'Vérifié',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  es: {
    findFrequency: 'Encuentra tu frecuencia.',
    subtitle: 'Descubre máquinas de slush en todo el mundo.',
    searchPlaceholder: 'Código postal o ciudad…',
    useLocation: 'Usar mi ubicación',
    within: 'En un radio de',
    openNow: 'Abierto ahora',
    getDirections: 'Cómo llegar',
    addStation: 'Agregar estación',
    noMachines: 'No se encontraron máquinas.',
    operational: 'Operacional',
    issueReported: 'Problema reportado',
    openNowLabel: 'Abierto',
    closedLabel: 'Cerrado',
    storeHours: 'Horario',
    machineCondition: 'Estado de la máquina',
    availableFlavours: 'Sabores disponibles',
    reportIssue: 'Reportar problema',
    submitStation: 'Enviar',
    nearby: 'Slush cercanos',
    foundNearby: 'encontrados',
    today: 'hoy',
    verified: 'Verificado',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  de: {
    findFrequency: 'Finde deine Frequenz.',
    subtitle: 'Entdecke Slush-Maschinen auf der ganzen Welt.',
    searchPlaceholder: 'Postleitzahl oder Stadt…',
    useLocation: 'Meinen Standort verwenden',
    within: 'Innerhalb von',
    openNow: 'Jetzt geöffnet',
    getDirections: 'Route',
    addStation: 'Station hinzufügen',
    noMachines: 'Keine Maschinen gefunden.',
    operational: 'In Betrieb',
    issueReported: 'Problem gemeldet',
    openNowLabel: 'Geöffnet',
    closedLabel: 'Geschlossen',
    storeHours: 'Öffnungszeiten',
    machineCondition: 'Maschinenzustand',
    availableFlavours: 'Verfügbare Sorten',
    reportIssue: 'Problem melden',
    submitStation: 'Einreichen',
    nearby: 'Slush in der Nähe',
    foundNearby: 'gefunden',
    today: 'heute',
    verified: 'Verifiziert',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  ja: {
    findFrequency: 'あなたの周波数を見つけよう。',
    subtitle: '世界中のスラッシュマシンを探す。',
    searchPlaceholder: '郵便番号または都市…',
    useLocation: '現在地を使用',
    within: '半径',
    openNow: '現在営業中',
    getDirections: '道順',
    addStation: 'スポットを追加',
    noMachines: '近くに機械が見つかりません。',
    operational: '稼働中',
    issueReported: '問題報告あり',
    openNowLabel: '営業中',
    closedLabel: '閉店',
    storeHours: '営業時間',
    machineCondition: 'マシンの状態',
    availableFlavours: '利用可能なフレーバー',
    reportIssue: '問題を報告',
    submitStation: '送信',
    nearby: '近くのスラッシュスポット',
    foundNearby: '件見つかりました',
    today: '今日',
    verified: '確認済み',
    kmLabel: 'km',
    miLabel: 'マイル',
  },
  pt: {
    findFrequency: 'Encontre sua frequência.',
    subtitle: 'Descubra máquinas de slush em todo o mundo.',
    searchPlaceholder: 'CEP ou cidade…',
    useLocation: 'Usar minha localização',
    within: 'Dentro de',
    openNow: 'Aberto agora',
    getDirections: 'Como chegar',
    addStation: 'Adicionar estação',
    noMachines: 'Nenhuma máquina encontrada.',
    operational: 'Operacional',
    issueReported: 'Problema relatado',
    openNowLabel: 'Aberto',
    closedLabel: 'Fechado',
    storeHours: 'Horário de funcionamento',
    machineCondition: 'Condição da máquina',
    availableFlavours: 'Sabores disponíveis',
    reportIssue: 'Relatar problema',
    submitStation: 'Enviar',
    nearby: 'Slush por perto',
    foundNearby: 'encontrados',
    today: 'hoje',
    verified: 'Verificado',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  it: {
    findFrequency: 'Trova la tua frequenza.',
    subtitle: 'Scopri macchine per granite in tutto il mondo.',
    searchPlaceholder: 'CAP o città…',
    useLocation: 'Usa la mia posizione',
    within: 'Entro',
    openNow: 'Aperto ora',
    getDirections: 'Indicazioni',
    addStation: 'Aggiungi stazione',
    noMachines: 'Nessuna macchina trovata.',
    operational: 'Operativo',
    issueReported: 'Problema segnalato',
    openNowLabel: 'Aperto',
    closedLabel: 'Chiuso',
    storeHours: 'Orari',
    machineCondition: 'Condizione macchina',
    availableFlavours: 'Gusti disponibili',
    reportIssue: 'Segnala problema',
    submitStation: 'Invia',
    nearby: 'Granite vicino a te',
    foundNearby: 'trovati',
    today: 'oggi',
    verified: 'Verificato',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  nl: {
    findFrequency: 'Vind jouw frequentie.',
    subtitle: 'Ontdek slush-machines over de hele wereld.',
    searchPlaceholder: 'Postcode of stad…',
    useLocation: 'Gebruik mijn locatie',
    within: 'Binnen',
    openNow: 'Nu open',
    getDirections: 'Route',
    addStation: 'Station toevoegen',
    noMachines: 'Geen machines gevonden.',
    operational: 'Operationeel',
    issueReported: 'Probleem gemeld',
    openNowLabel: 'Open',
    closedLabel: 'Gesloten',
    storeHours: 'Openingstijden',
    machineCondition: 'Machinestatus',
    availableFlavours: 'Beschikbare smaken',
    reportIssue: 'Probleem melden',
    submitStation: 'Indienen',
    nearby: 'Slush in de buurt',
    foundNearby: 'gevonden',
    today: 'vandaag',
    verified: 'Geverifieerd',
    kmLabel: 'km',
    miLabel: 'mi',
  },
  ko: {
    findFrequency: '당신의 주파수를 찾아보세요.',
    subtitle: '전 세계 슬러시 기계를 찾아보세요.',
    searchPlaceholder: '우편번호 또는 도시…',
    useLocation: '현재 위치 사용',
    within: '반경',
    openNow: '지금 영업 중',
    getDirections: '길찾기',
    addStation: '스테이션 추가',
    noMachines: '근처에 기계가 없습니다.',
    operational: '정상 운영',
    issueReported: '문제 보고됨',
    openNowLabel: '영업 중',
    closedLabel: '영업 종료',
    storeHours: '영업 시간',
    machineCondition: '기계 상태',
    availableFlavours: '이용 가능한 맛',
    reportIssue: '문제 신고',
    submitStation: '제출',
    nearby: '근처 슬러시 스팟',
    foundNearby: '개 발견',
    today: '오늘',
    verified: '확인됨',
    kmLabel: 'km',
    miLabel: '마일',
  },
  zh: {
    findFrequency: '找到你的频率。',
    subtitle: '发现全球各地的冰沙机。',
    searchPlaceholder: '邮政编码或城市…',
    useLocation: '使用当前位置',
    within: '范围',
    openNow: '现在营业',
    getDirections: '获取路线',
    addStation: '添加站点',
    noMachines: '附近未找到机器。',
    operational: '正常运营',
    issueReported: '已报告问题',
    openNowLabel: '营业中',
    closedLabel: '已关闭',
    storeHours: '营业时间',
    machineCondition: '机器状况',
    availableFlavours: '可用口味',
    reportIssue: '报告问题',
    submitStation: '提交',
    nearby: '附近的冰沙点',
    foundNearby: '个结果',
    today: '今天',
    verified: '已验证',
    kmLabel: '公里',
    miLabel: '英里',
  },
}

export function detectLanguage(): LangCode {
  if (typeof window === 'undefined') return 'en'
  const lang = navigator.language?.slice(0, 2).toLowerCase()
  const supported: LangCode[] = ['en','fr','es','de','ja','pt','it','nl','ko','zh']
  return supported.includes(lang as LangCode) ? (lang as LangCode) : 'en'
}

export function getStrings(lang?: LangCode): Strings {
  return TRANSLATIONS[lang ?? 'en'] ?? TRANSLATIONS['en']
}
