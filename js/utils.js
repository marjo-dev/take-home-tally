// General utility functions

export function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const fmtMoney = n => `$${(Number(n) || 0).toFixed(2)}`;

export const toISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const fmtDate = iso => new Date(iso + "T00:00:00")
  .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export const dayName = iso => new Date(iso + "T00:00:00")
  .toLocaleDateString(undefined, { weekday: "short" });

