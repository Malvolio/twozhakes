import memoize from "lodash/memoize";
import reduce from "lodash/reduce";
import moment from "moment-timezone";
import find from "lodash/find";

type TZUnitName =
  | "day"
  | "hour"
  | "millisecond"
  | "minute"
  | "month"
  | "quarter"
  | "second"
  | "week"
  | "year";

type TZUnit = (value: number) => TZValue;
type TZValue = {
  value: number;
  name: TZUnitName;
};

type TZSetterName =
  | TZUnitName
  | "date"
  | "dayOfYear"
  | "isoWeek"
  | "isoWeekYear"
  | "isoWeekday"
  | "quarter"
  | "weekYear"
  | "weekday";

type TZSetter = {
  name: TZSetterName;
};

type Datish = Date | number;

type TZOperator = (d: Datish) => Date;

export type TZ = {
  parse: (s: string) => Date;
  extract: (d: Datish, u: TZSetter | TZUnit) => number;
  operate: (d: Datish, ...ops: TZOperator[]) => Date;
  format: (d: Datish, spec: string) => string;
};

const isTZUnit = (u: TZSetter | TZUnit): u is TZUnit => {
  return typeof u === "function";
};
export const getTZ = memoize(
  (tzName: string): TZ => {
    const asDate = (d: Datish): Date =>
      typeof d === "number" ? new Date(d) : d;

    const parse = (s: string): Date => {
      return moment.tz(s, tzName).toDate();
    };
    const extract = (d: Datish, u: TZSetter | TZUnit): number => {
      const name = isTZUnit(u) ? getTZUnitName(u) : u.name;
      const m = moment(d);
      const f = m[name] as () => number;
      return f.call(m);
    };
    const operate = (d: Datish, ...ops: TZOperator[]): Date => {
      return reduce(ops, (acc, op) => op(acc), asDate(d));
    };
    const format = (d: Datish, spec: string): string => {
      return moment(d).tz(tzName).format(spec);
    };

    return {
      parse,
      extract,
      operate,
      format,
    };
  }
);

const _getTZUnit = memoize(
  (name: TZUnitName): TZUnit => (value: number) => ({ value, name })
);
const ALL_UNIT_NAMES = new Set([
  "day",
  "hour",
  "millisecond",
  "minute",
  "month",
  "quarter",
  "second",
  "week",
  "year",
]);
const isTZUnitName = (s: string): s is TZUnitName => {
  return ALL_UNIT_NAMES.has(s);
};

const _getTZSetter = memoize((name: TZSetterName): TZSetter => ({ name }));
const ALL_DISTINCT_SETTER_NAMES = new Set([
  "date",
  "dayOfYear",
  "isoWeek",
  "isoWeekYear",
  "isoWeekday",
  "weekYear",
  "weekday",
]);
const isTZSetterNames = (s: string): s is TZUnitName => {
  return ALL_UNIT_NAMES.has(s) || ALL_DISTINCT_SETTER_NAMES.has(s);
};

const cleanName = (s: string) => {
  const s1 = s.charAt(s.length - 1) === "s" ? s.substring(0, s.length - 1) : s;
  return s1.toLowerCase();
};

export const getTZUnit = memoize(
  (s: string): TZUnit => {
    const s2 = cleanName(s);
    if (!isTZUnitName(s2)) {
      throw new Error(`${s} is not a unit of time`);
    }
    return _getTZUnit(s2);
  }
);

export const getTZSetter = memoize(
  (s: string): TZSetter => {
    const s2 = cleanName(s);
    if (!isTZSetterNames(s2)) {
      throw new Error(`${s} is not a unit of time`);
    }
    return _getTZSetter(s2);
  }
);

export const units = {
  day: _getTZUnit("day"),
  hour: _getTZUnit("hour"),
  millisecond: _getTZUnit("millisecond"),
  minute: _getTZUnit("minute"),
  month: _getTZUnit("month"),
  quarter: _getTZUnit("quarter"),
  second: _getTZUnit("second"),
  week: _getTZUnit("week"),
  year: _getTZUnit("year"),
};

export const setters = {
  date: _getTZSetter("date"),
  dayOfYear: _getTZSetter("dayOfYear"),
  isoWeek: _getTZSetter("isoWeek"),
  isoWeekYear: _getTZSetter("isoWeekYear"),
  isoWeekday: _getTZSetter("isoWeekday"),
  weekYear: _getTZSetter("weekYear"),
  weekday: _getTZSetter("weekday"),
  ...units,
};

const getTZUnitName = (unit: TZUnit): TZUnitName => {
  const p = find(Object.entries(units), ([, value]) => value === unit);
  if (!p) {
    throw new Error("unknown unit!");
  }
  const [name] = p;
  return name as TZUnitName;
};

type _TZConstructor<T extends unknown[]> = (
  ...parms: T
) => (d: moment.Moment) => moment.Moment;

function makeOp<T extends unknown[]>(f: _TZConstructor<T>) {
  return (...t: T) => {
    const f1 = f(...t);
    return (d: Datish) => f1(moment(d)).toDate();
  };
}

export const operators = {
  add: makeOp((v: TZValue) => (m: moment.Moment) => m.add(v.value, v.name)),
  subtract: makeOp((v: TZValue) => (m: moment.Moment) =>
    m.subtract(v.value, v.name)
  ),
  set: makeOp((v: TZValue) => (m: moment.Moment) => {
    const f = m[v.name] as (n: number) => moment.Moment;
    f.apply(m, [v.value]);
    return m;
  }),
  startOf: makeOp((v: TZUnit) => (m: moment.Moment) =>
    m.startOf(getTZUnitName(v))
  ),
  endOf: makeOp((v: TZUnit) => (m: moment.Moment) => m.endOf(getTZUnitName(v))),
};

export const UTC = getTZ("UTC");

export const SystemTZ = getTZ(moment.tz.guess());
