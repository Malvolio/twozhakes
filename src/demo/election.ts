import { TZ, operators, getTZ, units, setters, composeOps } from "../lib";
import { nextDayOfWeek } from "./next";
const { year, day, hour } = units;
const { month } = setters;
const { startOf, add, set } = operators;

const startOfNextYear = composeOps(startOf(year), add(year(1)));

// US Federal elections only occur on even-numbered years.
const isElectionYear = (d: Date, tz: TZ): boolean => !(tz.extract(d, year) % 2);

export const nextElectionDay = (d: Date): Date => {
  // local time does not matter; all calculations are done in DC time
  const tz = getTZ("America/New_York");
  if (!tz.extract(d, isElectionYear)) {
    return nextElectionDay(tz.operate(d, startOfNextYear));
  }

  // US Federal elections only occur on the day after the first Monday in November.
  const electionDay = tz.operate(
    d,
    set(month(10)),
    startOf(month),
    nextDayOfWeek(1, true),
    add(day(1))
  );

  // the polls close at 5pm
  const pollsClose = tz.operate(electionDay, set(hour(17)));

  // if the polls have closed, wait until next year.
  return d < pollsClose
    ? electionDay
    : nextElectionDay(tz.operate(d, startOfNextYear));
};
