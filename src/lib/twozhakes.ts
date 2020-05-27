import memoize from "lodash/memoize";
import reduce from "lodash/reduce";
import fromPairs from "lodash/fromPairs";
import map from "lodash/map";
import moment from "moment-timezone";

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
  unitName: TZUnitName;
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

export const asDate = (d: Datish): Date =>
  typeof d === "number" ? new Date(d) : d;

export const getTZ = memoize(
  (tzName: string): TZ => {
    const parse = (s: string): Date => {
      return moment.tz(s, tzName).toDate();
    };
    const extract = (d: Datish, u: TZSetter | TZUnit): number => {
      const m = moment(d);
      const name = u.name as TZUnitName;
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

const makeTZUnit = memoize(
  (name: TZUnitName): TZUnit => {
    // hack to produce a named function
    const maker = new Function(
      `return function ${name}(value) { return { unitName: "${name}", value }; };`
    );
    return maker();
  }
);

const ALL_UNIT_NAMES_LIST: TZUnitName[] = [
  "day",
  "hour",
  "millisecond",
  "minute",
  "month",
  "quarter",
  "second",
  "week",
  "year",
];
const ALL_UNIT_NAMES = new Set<string>(ALL_UNIT_NAMES_LIST);

const isTZUnitName = (s: string): s is TZUnitName => {
  return ALL_UNIT_NAMES.has(s);
};

const makeZSetter = memoize((name: TZSetterName): TZSetter => ({ name }));

const ALL_DISTINCT_SETTER_NAMES_LIST: TZSetterName[] = [
  "date",
  "dayOfYear",
  "isoWeek",
  "isoWeekYear",
  "isoWeekday",
  "weekYear",
  "weekday",
];
const ALL_DISTINCT_SETTER_NAMES = new Set<string>(
  ALL_DISTINCT_SETTER_NAMES_LIST
);

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
    return makeTZUnit(s2);
  }
);

export const getTZSetter = memoize(
  (s: string): TZSetter => {
    const s2 = cleanName(s);
    if (!isTZSetterNames(s2)) {
      throw new Error(`${s} is not a unit of time`);
    }
    return makeZSetter(s2);
  }
);

export const units = fromPairs(
  map(ALL_UNIT_NAMES_LIST, (name) => [name, makeTZUnit(name)])
);

export const setters = {
  ...fromPairs(
    map(ALL_DISTINCT_SETTER_NAMES_LIST, (name) => [name, makeZSetter(name)])
  ),
  ...units,
};

type Constructor<T, P extends unknown[]> = (...parms: P) => T;

type MomentOp = (d: moment.Moment) => moment.Moment;

function wrapOp<P extends unknown[]>(
  f: Constructor<MomentOp, P>
): Constructor<TZOperator, P> {
  return (...p: P) => {
    const f1 = f(...p);
    return (d: Datish) => f1(moment(d)).toDate();
  };
}

export const operators = {
  add: wrapOp((v: TZValue) => (m: moment.Moment) => m.add(v.value, v.unitName)),
  subtract: wrapOp((v: TZValue) => (m: moment.Moment) =>
    m.subtract(v.value, v.unitName)
  ),
  set: wrapOp((v: TZValue) => (m: moment.Moment) => {
    const f = m[v.unitName] as (n: number) => moment.Moment;
    f.apply(m, [v.value]);
    return m;
  }),
  startOf: wrapOp((unit: TZUnit) => (m: moment.Moment) =>
    m.startOf(<TZUnitName>unit.name)
  ),
  endOf: wrapOp((unit: TZUnit) => (m: moment.Moment) =>
    m.endOf(<TZUnitName>unit.name)
  ),
};

export const UTC = getTZ("UTC");

export const SystemTZ = getTZ(moment.tz.guess());
