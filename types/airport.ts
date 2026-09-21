export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string;
  /** IANA timezone used to render scheduled times in airport-local time. */
  timeZone: string;
};

export type EventCity = {
  city: string;
  country: string;
};

export type RouteEndpoint = 'origin' | 'destination';
