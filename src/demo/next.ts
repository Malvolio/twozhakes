import identity from "lodash/identity";
import { TZ, operators, TZUnit, units } from "../lib";
const { set, startOf, add } = operators;
const { day, week, month, year } = units;

const startOfNext = (u: TZUnit) => (d: Date, tz: TZ) =>
  tz.operate(d, startOf(u), add(u(1)));

/**
 * @ignore
 * Generate the next functions, given the two units involved
 * @param smallerUnit
 * @param largerUnit
 */
const next = (smallerUnit: TZUnit, largerUnit: TZUnit) => (
  n: number,
  inclusive?: boolean
) => (d: Date, tz: TZ) => {
  const nnow = tz.extract(d, smallerUnit);
  return tz.operate(
    d,
    nnow < n || (inclusive && nnow === n) ? identity : startOfNext(largerUnit),
    set(smallerUnit(n)),
    startOf(smallerUnit)
  );
};

/**
 * Answers questions like "when is next Thursday?"
 * @param date - the starting time
 * @param inclusive — if you ask "when is next Thursday?" when it _is_ Thursday, should you get today?
 *
 * It takes two units, th
 */
export const nextDayOfWeek = next(day, week);
/**
 * Answers questions like "when is next April?"
 * @param date - the starting time
 * @param inclusive — if you ask "when is next April?" when it _is_ April, should you get this month?
 *
 * It takes two units, th
 */
export const nextMonth = next(month, year);
