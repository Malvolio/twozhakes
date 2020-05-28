import memoize from "lodash/memoize";
import reduce from "lodash/reduce";
import fromPairs from "lodash/fromPairs";
import map from "lodash/map";
import moment, { Moment } from "moment-timezone";
/*
Getters -- can be used in extract().  Given a moment, they return a value.  All getters except format() get numbers
Setters -- all Setters are also Getters, but can be used in set(); the Getter function is separate
Units -- all Units are also Setters, but can be used in math();

Setter functions return TZValue<TZSetterNames>
Unit functions return TZValue<TZUnitNames>

extract takes setters or getters but recognizes setters and substitutes the Getter function of the same name*/

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

const ALL_DISTINCT_SETTER_NAMES_LIST: TZSetterName[] = [
  "date",
  "dayOfYear",
  "isoWeek",
  "isoWeekYear",
  "isoWeekday",
  "weekYear",
  "weekday",
  "isoWeekYear",
];

const makeAllGetters = (names: TZSetterName[]) =>
  fromPairs(
    map(names, (name) => [
      name,
      (d: Date, tzName: string) => moment(d).tz(tzName).get(name),
    ])
  );

export const SPECIAL_GETTERS = makeAllGetters([
  ...ALL_UNIT_NAMES_LIST,
  ...ALL_DISTINCT_SETTER_NAMES_LIST,
]);

type TZValue<T> = {
  value: number;
  name: T;
};

type TZUnit = (value: number) => TZValue<TZUnitName>;
type TZSetter = (value: number) => TZValue<TZSetterName>;
type TZGetter<T> = (d: Date, tzName: string) => T;
type TZOperator = (d: Date, tzName: string) => Date;

type Datish = Date | number;

type TZExtraction<U extends TZGetter<unknown> | TZSetter> = U extends TZGetter<
  infer T
>
  ? T
  : number;

export const asDate = (d: Datish): Date =>
  typeof d === "number" ? new Date(d) : d;

const isGetter = (u: TZSetter | TZGetter<unknown>): u is TZSetter => {
  return !!SPECIAL_GETTERS[u.name];
};

const getGetter = (u: TZSetter): TZGetter<number> => {
  return SPECIAL_GETTERS[u.name];
};

export type TZ = {
  parse: (s: string) => Date;
  extract: <T extends TZGetter<unknown> | TZSetter>(
    d: Datish,
    extractor: T
  ) => TZExtraction<T>;
  operate: (d: Datish, ...ops: TZOperator[]) => Date;
};

export const getTZ = memoize(
  (tzName: string): TZ => {
    const parse = (s: string): Date => {
      return moment.tz(s, tzName).toDate();
    };
    const extract = <T extends TZGetter<unknown> | TZSetter>(
      d: Datish,
      u: T
    ): TZExtraction<T> => {
      const op = isGetter(u) ? getGetter(u) : (u as TZGetter<any>);
      return op(asDate(d), tzName);
    };
    const operate = (d: Datish, ...ops: TZOperator[]): Date => {
      return reduce(ops, (acc, op) => op(acc, tzName), asDate(d));
    };

    return {
      parse,
      extract,
      operate,
    };
  }
);

const makeTZValueMaker = memoize(
  (name: string): TZSetter => {
    // hack to produce a named function
    const maker = new Function(
      `return function ${name}(value) { return { name: "${name}", value }; };`
    );
    return maker();
  }
);

const makeTZUnit = (name: TZUnitName): TZUnit =>
  makeTZValueMaker(name) as TZUnit;

const ALL_UNIT_NAMES = new Set<string>(ALL_UNIT_NAMES_LIST);

const isTZUnitName = (name: string): name is TZUnitName => {
  return ALL_UNIT_NAMES.has(name);
};

const makeZSetter = (name: TZSetterName): TZSetter => makeTZValueMaker(name);

const ALL_DISTINCT_SETTER_NAMES = new Set<string>(
  ALL_DISTINCT_SETTER_NAMES_LIST
);

const isTZSetterNames = (name: string): name is TZUnitName => {
  return ALL_UNIT_NAMES.has(name) || ALL_DISTINCT_SETTER_NAMES.has(name);
};

const cleanName = (name: string) => {
  const lowerName = name.toLowerCase();
  return lowerName.charAt(name.length - 1) === "s"
    ? lowerName.substring(0, name.length - 1)
    : lowerName;
};

export const getTZUnit = memoize(
  (name: string): TZUnit => {
    const cleanedName = cleanName(name);
    if (!isTZUnitName(cleanedName)) {
      throw new Error(`${name} is not a unit of time`);
    }
    return makeTZUnit(cleanedName);
  }
);

export const getTZSetter = memoize(
  (name: string): TZSetter => {
    const cleanedName = cleanName(name);
    if (!isTZSetterNames(cleanedName)) {
      throw new Error(`${name} is not a unit of time`);
    }
    return makeZSetter(cleanedName);
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

type MomentOp = (d: Moment) => Moment;

function wrapOp<P extends unknown[]>(
  f: Constructor<MomentOp, P>
): Constructor<TZOperator, P> {
  return (...p: P) => {
    const f1 = f(...p);
    return (d: Datish) => f1(moment(d)).toDate();
  };
}

export const operators = {
  add: wrapOp((v: TZValue<TZUnitName>) => (m: Moment) =>
    m.add(v.value, v.name)
  ),
  subtract: wrapOp((v: TZValue<TZUnitName>) => (m: Moment) =>
    m.subtract(v.value, v.name)
  ),
  set: wrapOp((v: TZValue<TZSetterName>) => (m: Moment) => {
    const f = m[v.name] as (n: number) => Moment;
    f.apply(m, [v.value]);
    return m;
  }),
  startOf: wrapOp((unit: TZUnit) => (m: Moment) =>
    m.startOf(<TZUnitName>unit.name)
  ),
  endOf: wrapOp((unit: TZUnit) => (m: Moment) =>
    m.endOf(<TZUnitName>unit.name)
  ),
};

const wrapMomentGetter = <T>(f: (m: Moment) => T) => (
  d: Date,
  tzName: string
) => f(moment(d).tz(tzName));

const format = (spec: string) =>
  wrapMomentGetter((m: Moment) => m.format(spec));
const weeksInYear = wrapMomentGetter((m: Moment) => m.weeksInYear());
const isoWeeksInYear = wrapMomentGetter((m: Moment) => m.isoWeeksInYear());

export const getters = {
  format,
  weeksInYear,
  isoWeeksInYear,
  ...setters,
};

export const UTC = getTZ("UTC");

export const SystemTZ = getTZ(moment.tz.guess());
