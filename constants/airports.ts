import type { Airport } from '@/types/airport';

/** Major airports for route search (MVP static list — expand or move to DB later). */
export const AIRPORTS: Airport[] = [
  { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong' },
  { iata: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China' },
  { iata: 'PKX', name: 'Beijing Daxing', city: 'Beijing', country: 'China' },
  { iata: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China' },
  { iata: 'SHA', name: 'Shanghai Hongqiao', city: 'Shanghai', country: 'China' },
  { iata: 'CAN', name: 'Guangzhou Baiyun', city: 'Guangzhou', country: 'China' },
  { iata: 'SZX', name: 'Shenzhen Bao\'an', city: 'Shenzhen', country: 'China' },
  { iata: 'CTU', name: 'Chengdu Tianfu', city: 'Chengdu', country: 'China' },
  { iata: 'CKG', name: 'Chongqing Jiangbei', city: 'Chongqing', country: 'China' },
  { iata: 'XIY', name: 'Xi\'an Xianyang', city: 'Xi\'an', country: 'China' },
  { iata: 'HGH', name: 'Hangzhou Xiaoshan', city: 'Hangzhou', country: 'China' },
  { iata: 'NKG', name: 'Nanjing Lukou', city: 'Nanjing', country: 'China' },
  { iata: 'TAO', name: 'Qingdao Jiaodong', city: 'Qingdao', country: 'China' },
  { iata: 'XMN', name: 'Xiamen Gaoqi', city: 'Xiamen', country: 'China' },
  { iata: 'WUH', name: 'Wuhan Tianhe', city: 'Wuhan', country: 'China' },
  { iata: 'TPE', name: 'Taiwan Taoyuan', city: 'Taipei', country: 'Taiwan' },
  { iata: 'TSA', name: 'Taipei Songshan', city: 'Taipei', country: 'Taiwan' },
  { iata: 'KHH', name: 'Kaohsiung International', city: 'Kaohsiung', country: 'Taiwan' },
  { iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan' },
  { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan' },
  { iata: 'KIX', name: 'Osaka Kansai', city: 'Osaka', country: 'Japan' },
  { iata: 'ITM', name: 'Osaka Itami', city: 'Osaka', country: 'Japan' },
  { iata: 'NGO', name: 'Chubu Centrair', city: 'Nagoya', country: 'Japan' },
  { iata: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japan' },
  { iata: 'CTS', name: 'New Chitose', city: 'Sapporo', country: 'Japan' },
  { iata: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea' },
  { iata: 'GMP', name: 'Gimpo International', city: 'Seoul', country: 'South Korea' },
  { iata: 'PUS', name: 'Gimhae International', city: 'Busan', country: 'South Korea' },
  { iata: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia' },
  { iata: 'PEN', name: 'Penang International', city: 'Penang', country: 'Malaysia' },
  { iata: 'BKI', name: 'Kota Kinabalu International', city: 'Kota Kinabalu', country: 'Malaysia' },
  { iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { iata: 'DMK', name: 'Don Mueang', city: 'Bangkok', country: 'Thailand' },
  { iata: 'HKT', name: 'Phuket International', city: 'Phuket', country: 'Thailand' },
  { iata: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', country: 'Thailand' },
  { iata: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { iata: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam' },
  { iata: 'DAD', name: 'Da Nang International', city: 'Da Nang', country: 'Vietnam' },
  { iata: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines' },
  { iata: 'CEB', name: 'Mactan-Cebu International', city: 'Cebu', country: 'Philippines' },
  { iata: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia' },
  { iata: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'Indonesia' },
  { iata: 'SUB', name: 'Juanda International', city: 'Surabaya', country: 'Indonesia' },
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India' },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai', country: 'India' },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India' },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India' },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India' },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata', country: 'India' },
  { iata: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia' },
  { iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
  { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
  { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia' },
  { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
  { iata: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand' },
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar' },
  { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE' },
  { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia' },
  { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia' },
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom' },
  { iata: 'LGW', name: 'Gatwick', city: 'London', country: 'United Kingdom' },
  { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom' },
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { iata: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
  { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
  { iata: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy' },
  { iata: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy' },
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain' },
  { iata: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'Spain' },
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
  { iata: 'EWR', name: 'Newark Liberty International', city: 'New York', country: 'United States' },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States' },
  { iata: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States' },
  { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States' },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States' },
  { iata: 'YYZ', name: 'Pearson International', city: 'Toronto', country: 'Canada' },
  { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada' },
  { iata: 'YUL', name: 'Montréal-Trudeau', city: 'Montreal', country: 'Canada' },
  { iata: 'GRU', name: 'Guarulhos International', city: 'São Paulo', country: 'Brazil' },
  { iata: 'GIG', name: 'Galeão International', city: 'Rio de Janeiro', country: 'Brazil' },
  { iata: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa' },
  { iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa' },
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
    const haystack = `${airport.iata} ${airport.name} ${airport.city} ${airport.country}`.toLowerCase();
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
