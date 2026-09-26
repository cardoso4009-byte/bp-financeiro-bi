import type { V2ForecastEntry } from './v2-forecast'

export const V2_FORECAST_ENTRIES_KEY='bp-financeiro-v2-forecast-entries-2026'

function readJson<T>(key:string,fallback:T):T{
  if(typeof window==='undefined') return fallback
  try{const raw=window.localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}
}
export function readV2ForecastEntries():V2ForecastEntry[]{return readJson<V2ForecastEntry[]>(V2_FORECAST_ENTRIES_KEY,[])}
export function writeV2ForecastEntries(entries:V2ForecastEntry[]):void{
  if(typeof window!=='undefined') window.localStorage.setItem(V2_FORECAST_ENTRIES_KEY,JSON.stringify(entries))
}
