// Date utility functions for paycheck calculations

import { toISO } from "../utils.js";

export function startOfWeekMonday(d) {
  const date = new Date(d + "T00:00:00");
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return toISO(date);
}

export function endOfWeekSunday(d) {
  const mon = new Date(startOfWeekMonday(d));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return toISO(sun);
}

export function calcPayDate(wkEndISO) {
  const d = new Date(wkEndISO + "T00:00:00");
  d.setDate(d.getDate() + 3); // next Wednesday
  return toISO(d);
}

