import type { Airport, EventCity } from '@/types/airport';

/** Major airports for route search (MVP static list — expand or move to DB later). */
export const AIRPORTS: Airport[] = [
  { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', timeZone: 'Asia/Hong_Kong' },
  { iata: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'PKX', name: 'Beijing Daxing', city: 'Beijing', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'SHA', name: 'Shanghai Hongqiao', city: 'Shanghai', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'CAN', name: 'Guangzhou Baiyun', city: 'Guangzhou', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'SZX', name: "Shenzhen Bao'an", city: 'Shenzhen', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'CTU', name: 'Chengdu Tianfu', city: 'Chengdu', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'CKG', name: 'Chongqing Jiangbei', city: 'Chongqing', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'XIY', name: "Xi'an Xianyang", city: "Xi'an", country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'HGH', name: 'Hangzhou Xiaoshan', city: 'Hangzhou', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'NKG', name: 'Nanjing Lukou', city: 'Nanjing', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'TAO', name: 'Qingdao Jiaodong', city: 'Qingdao', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'XMN', name: 'Xiamen Gaoqi', city: 'Xiamen', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'WUH', name: 'Wuhan Tianhe', city: 'Wuhan', country: 'China', timeZone: 'Asia/Shanghai' },
  { iata: 'TPE', name: 'Taiwan Taoyuan', city: 'Taipei', country: 'Taiwan', timeZone: 'Asia/Taipei' },
  { iata: 'TSA', name: 'Taipei Songshan', city: 'Taipei', country: 'Taiwan', timeZone: 'Asia/Taipei' },
  { iata: 'KHH', name: 'Kaohsiung International', city: 'Kaohsiung', country: 'Taiwan', timeZone: 'Asia/Taipei' },
  { iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'KIX', name: 'Osaka Kansai', city: 'Osaka', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'ITM', name: 'Osaka Itami', city: 'Osaka', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'NGO', name: 'Chubu Centrair', city: 'Nagoya', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'CTS', name: 'New Chitose', city: 'Sapporo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { iata: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', timeZone: 'Asia/Seoul' },
  { iata: 'GMP', name: 'Gimpo International', city: 'Seoul', country: 'South Korea', timeZone: 'Asia/Seoul' },
  { iata: 'PUS', name: 'Gimhae International', city: 'Busan', country: 'South Korea', timeZone: 'Asia/Seoul' },
  { iata: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
  { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur' },
  { iata: 'PEN', name: 'Penang International', city: 'Penang', country: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur' },
  { iata: 'BKI', name: 'Kota Kinabalu International', city: 'Kota Kinabalu', country: 'Malaysia', timeZone: 'Asia/Kuching' },
  { iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', timeZone: 'Asia/Bangkok' },
  { iata: 'DMK', name: 'Don Mueang', city: 'Bangkok', country: 'Thailand', timeZone: 'Asia/Bangkok' },
  { iata: 'HKT', name: 'Phuket International', city: 'Phuket', country: 'Thailand', timeZone: 'Asia/Bangkok' },
  { iata: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', country: 'Thailand', timeZone: 'Asia/Bangkok' },
  { iata: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh City', country: 'Vietnam', timeZone: 'Asia/Ho_Chi_Minh' },
  { iata: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam', timeZone: 'Asia/Ho_Chi_Minh' },
  { iata: 'DAD', name: 'Da Nang International', city: 'Da Nang', country: 'Vietnam', timeZone: 'Asia/Ho_Chi_Minh' },
  { iata: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', timeZone: 'Asia/Manila' },
  { iata: 'CEB', name: 'Mactan-Cebu International', city: 'Cebu', country: 'Philippines', timeZone: 'Asia/Manila' },
  { iata: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia', timeZone: 'Asia/Jakarta' },
  { iata: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'Indonesia', timeZone: 'Asia/Makassar' },
  { iata: 'SUB', name: 'Juanda International', city: 'Surabaya', country: 'Indonesia', timeZone: 'Asia/Jakarta' },
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', timeZone: 'Asia/Kolkata' },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai', country: 'India', timeZone: 'Asia/Kolkata' },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India', timeZone: 'Asia/Kolkata' },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', timeZone: 'Asia/Kolkata' },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India', timeZone: 'Asia/Kolkata' },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata', country: 'India', timeZone: 'Asia/Kolkata' },
  { iata: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
  { iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', timeZone: 'Australia/Melbourne' },
  { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', timeZone: 'Australia/Brisbane' },
  { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', timeZone: 'Australia/Perth' },
  { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', timeZone: 'Pacific/Auckland' },
  { iata: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand', timeZone: 'Pacific/Auckland' },
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', timeZone: 'Asia/Dubai' },
  { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', timeZone: 'Asia/Qatar' },
  { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE', timeZone: 'Asia/Dubai' },
  { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia', timeZone: 'Asia/Riyadh' },
  { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia', timeZone: 'Asia/Riyadh' },
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', timeZone: 'Europe/Istanbul' },
  { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { iata: 'LGW', name: 'Gatwick', city: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', timeZone: 'Europe/London' },
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { iata: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', timeZone: 'Europe/Berlin' },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', timeZone: 'Europe/Berlin' },
  { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', timeZone: 'Europe/Amsterdam' },
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', timeZone: 'Europe/Zurich' },
  { iata: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy', timeZone: 'Europe/Rome' },
  { iata: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy', timeZone: 'Europe/Rome' },
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', timeZone: 'Europe/Madrid' },
  { iata: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'Spain', timeZone: 'Europe/Madrid' },
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { iata: 'EWR', name: 'Newark Liberty International', city: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', timeZone: 'America/Los_Angeles' },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', timeZone: 'America/Los_Angeles' },
  { iata: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States', timeZone: 'America/Chicago' },
  { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States', timeZone: 'America/Chicago' },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States', timeZone: 'America/Los_Angeles' },
  { iata: 'YYZ', name: 'Pearson International', city: 'Toronto', country: 'Canada', timeZone: 'America/Toronto' },
  { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', timeZone: 'America/Vancouver' },
  { iata: 'YUL', name: 'Montréal-Trudeau', city: 'Montreal', country: 'Canada', timeZone: 'America/Toronto' },
  { iata: 'GRU', name: 'Guarulhos International', city: 'São Paulo', country: 'Brazil', timeZone: 'America/Sao_Paulo' },
  { iata: 'GIG', name: 'Galeão International', city: 'Rio de Janeiro', country: 'Brazil', timeZone: 'America/Sao_Paulo' },
  { iata: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', timeZone: 'Africa/Johannesburg' },
  { iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', timeZone: 'Africa/Johannesburg' },
];

export function findAirportByIata(iata: string | null | undefined): Airport | undefined {
  if (!iata) return undefined;
  const code = iata.trim().toUpperCase();
  return AIRPORTS.find((airport) => airport.iata === code);
}

export function searchAirports(
  query: string,
  options?: { excludeIata?: string; preferIata?: string },
): Airport[] {
  const normalized = query.trim().toLowerCase();
  const exclude = options?.excludeIata?.trim().toUpperCase();
  const prefer = options?.preferIata?.trim().toUpperCase();

  let results = AIRPORTS.filter((airport) => {
    if (exclude && airport.iata === exclude) return false;
    if (!normalized) return true;
    const haystack =
      `${airport.iata} ${airport.name} ${airport.city} ${airport.country}`.toLowerCase();
    return haystack.includes(normalized);
  });

  if (prefer) {
    results = [...results].sort((a, b) => {
      if (a.iata === prefer) return -1;
      if (b.iata === prefer) return 1;
      return a.city.localeCompare(b.city);
    });
  } else {
    results = [...results].sort((a, b) => a.city.localeCompare(b.city));
  }

  return results;
}

const EVENT_CITIES: EventCity[] = (() => {
  const seen = new Map<string, EventCity>();
  for (const airport of AIRPORTS) {
    const key = `${airport.city.toLowerCase()}|${airport.country.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, { city: airport.city, country: airport.country });
    }
  }
  return [...seen.values()].sort((a, b) => a.city.localeCompare(b.city));
})();

export function formatEventCityLabel(entry: EventCity): string {
  return `${entry.city}, ${entry.country}`;
}

export function getEventCities(): EventCity[] {
  return EVENT_CITIES;
}

export function searchEventCities(query: string): EventCity[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return EVENT_CITIES;
  return EVENT_CITIES.filter((entry) => {
    const haystack = `${entry.city} ${entry.country}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function findEventCity(city: string | null | undefined): EventCity | undefined {
  if (!city?.trim()) return undefined;
  const normalized = city.trim().toLowerCase();
  return EVENT_CITIES.find((entry) => entry.city.toLowerCase() === normalized);
}
