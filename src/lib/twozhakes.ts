import memoize from "lodash/memoize";
import reduce from "lodash/reduce";
import moment, { Moment } from "moment-timezone";

type TZUnitName =
  | "millisecond"
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

const ALL_UNIT_NAMES_LIST: TZUnitName[] = [
  "millisecond",
  "second",
  "minute",
  "hour",
  "day", // as a setter, this means "dayOfWeek"
  "week",
  "month",
  "quarter",
  "year",
];

type TZSetterName =
  | TZUnitName
  | "date" // this means "dayOfMonth"
  | "dayOfYear"
  | "isoWeek"
  | "isoWeekYear"
  | "isoWeekday"
  | "weekYear"
  | "weekday";

const ALL_SETTER_NAMES_LIST: TZSetterName[] = [
  "date",
  "dayOfYear",
  "isoWeek",
  "isoWeekYear",
  "isoWeekday",
  "weekYear",
  "weekday",
  "isoWeekYear",
  ...ALL_UNIT_NAMES_LIST,
];

/**
 * A setter or unit function returns a TZValue.
 * So `millisecond(3)` return `{name: 'millisecond', value: 3}`
 * Standard setters and unit functions can always be looked up by name.
 */
export type TZValue<T> = {
  value: number;
  name: T;
};

type TZSetterF<T> = ((value: number) => TZValue<T>) & {
  name: T;
  getter: TZGetter<number>;
};

/**
 * a standard unit of time, such a millisecond or a year
 */
export type TZUnit = TZSetterF<TZUnitName>;
/**
 * can be used to set some aspect of a time, so `weekYear(3)`
 * would set a time to the third week of the year.
 * All units are setters, of course.  `month(3)` can be used
 * to set a time to April.
 */
export type TZSetter = TZSetterF<TZSetterName>;
/**
 * extract a value from a given date in the context of the
 * given TZ.
 * Units and setters functions can be used as if they were
 * getters, because the `extract()` method will look up the
 * actual getter by name.
 */
export type TZGetter<T> = (d: Date, tz: TZ) => T;

/**
 * create a new date from a given date in the context of the
 * given TZ.
 */
export type TZOperator = TZGetter<Date>;

type Datish = Date | number;

type TZExtractor = TZGetter<unknown> | TZSetter;
type TZExtraction<U extends TZExtractor> = U extends TZGetter<infer T>
  ? T
  : number;

export const asDate = (d: Datish): Date =>
  typeof d === "number" ? new Date(d) : d;

const isGetter = (u: TZSetter | TZGetter<unknown>): u is TZSetter => {
  return "getter" in u;
};

const getGetter = (u: TZSetter): TZGetter<number> => {
  return u.getter;
};

const asGetter = (u: TZExtractor): TZGetter<any> => {
  return isGetter(u) ? getGetter(u) : u;
};

// in case some wisacre gets the idea to reuse a Date
const isolateDate = (d: Date): Date => new Date(d.getTime());

export const composeOps = (...ops: TZOperator[]): TZOperator => (
  d: Date,
  tz: TZ
) => reduce(ops, (acc, op) => isolateDate(op(acc, tz)), d);

/**
 * The basic reification of a time zone.  It offers the three key functions:
 *
 * @param parse — given a string, return a Date
 * @param extract - given a date and either a getter or a unit, returns some number or string
 * @param operate -- given a date and list of operators, apply each of those operators to the date in series
 */
export type TZ = Readonly<{
  tzName: string;
  parse: (s: string) => Date;
  extract: <T extends TZExtractor>(d: Datish, extractor: T) => TZExtraction<T>;
  operate: (d: Datish, ...ops: TZOperator[]) => Date;
}>;

/**
 * Get a TZ for the given zone name, e.g. a string like 'America/New York' or 'Asia/Shanghai',
 * return the TZ that will execute in that context.
 */
export const getTZ = memoize(
  (tzName: string): TZ => {
    const tz: TZ = Object.freeze({
      tzName,
      parse: (s: string): Date => moment.tz(s, tzName).toDate(),
      extract: <T extends TZExtractor>(d: Datish, u: T): TZExtraction<T> =>
        asGetter(u)(asDate(d), tz),
      operate: (d: Datish, ...ops: TZOperator[]): Date =>
        composeOps(...ops)(asDate(d), tz),
    });

    return tz;
  }
);

const makeTZValueMaker = memoize(
  (name: TZUnitName | TZSetterName): TZSetter => {
    // hack to produce a named function
    const maker = new Function(
      `return function ${name}(value) { return { name: "${name}", value }; };`
    );
    const setter: TZSetter = maker();
    setter.getter = (d: Date, { tzName }: TZ) => moment(d).tz(tzName).get(name);
    return setter;
  }
);

const makeTZUnit = (name: TZUnitName): TZUnit =>
  makeTZValueMaker(name) as TZUnit;

const makeZSetter = (name: TZSetterName): TZSetter => makeTZValueMaker(name);

const makeisTZType = <TN extends string>(namesList: TN[]) => {
  const allNames = new Set<string>(namesList);
  return memoize((name: string): name is TN => allNames.has(name));
};

const isTZUnitName = makeisTZType(ALL_UNIT_NAMES_LIST);

const isTZSetterNames = makeisTZType(ALL_SETTER_NAMES_LIST);

const cleanName = (name: string) => {
  return name.charAt(name.length - 1) === "s"
    ? name.substring(0, name.length - 1)
    : name;
};

/**
 * A utility function to convert the name of a unit to the unit itself.
 * So 'millisecond' maps to `millisecond`.
 * Case-sensitive but plural-insensitive
 */
export const getTZUnit = memoize(
  (name: string): TZUnit => {
    const cleanedName = cleanName(name);
    if (!isTZUnitName(cleanedName)) {
      throw new Error(`${name} is not a unit of time`);
    }
    return makeTZUnit(cleanedName);
  }
);

/**
 * A utility function to convert the name of a setter to the setter itself.
 * So 'isoWeekYear' maps to `isoWeekYear`.
 * Case-sensitive but plural-insensitive
 */
export const getTZSetter = memoize(
  (name: string): TZSetter => {
    const cleanedName = cleanName(name);
    if (!isTZSetterNames(cleanedName)) {
      throw new Error(`${name} is not a time setter`);
    }
    return makeZSetter(cleanedName);
  }
);

/**
 * All the legal units
 */
export const units = {
  millisecond: makeTZUnit("millisecond"),
  second: makeTZUnit("second"),
  minute: makeTZUnit("minute"),
  hour: makeTZUnit("hour"),
  day: makeTZUnit("day"),
  week: makeTZUnit("week"),
  month: makeTZUnit("month"),
  quarter: makeTZUnit("quarter"),
  year: makeTZUnit("year"),
} as const;

/**
 * All the legal setters
 * You might think you want to make your own setter, but you don't.
 * Instead, create your own operator and use that.
 * The setters are only meant for the existing `set()` operator
 * constructor.
 */
export const setters = {
  date: makeZSetter("date"),
  dayOfYear: makeZSetter("dayOfYear"),
  isoWeek: makeZSetter("isoWeek"),
  isoWeekYear: makeZSetter("isoWeekYear"),
  isoWeekday: makeZSetter("isoWeekday"),
  weekYear: makeZSetter("weekYear"),
  weekday: makeZSetter("weekday"),
  ...units,
} as const;

type Constructor<T, P extends unknown[]> = (...params: P) => T;

type MomentOp = (d: Moment) => Moment;

function wrapOp<P extends unknown[]>(
  f: Constructor<MomentOp, P>
): Constructor<TZOperator, P> {
  return (...params: P) => {
    const f1 = f(...params);
    return (d: Date, { tzName }: TZ) => f1(moment(d).tz(tzName)).toDate();
  };
}

/**
 * The six built-in operators, straight from Moment.js
 */
export const operators = {
  set: wrapOp((v: TZValue<TZSetterName>) => (m: Moment) => {
    const f = m[v.name] as (n: number) => Moment;
    f.apply(m, [v.value]);
    return m;
  }),
  add: wrapOp((v: TZValue<TZUnitName>) => (m: Moment) =>
    m.add(v.value, v.name)
  ),
  subtract: wrapOp((v: TZValue<TZUnitName>) => (m: Moment) =>
    m.subtract(v.value, v.name)
  ),
  startOf: wrapOp((unit: TZUnit) => (m: Moment) => m.startOf(unit.name)),
  endOf: wrapOp((unit: TZUnit) => (m: Moment) => m.endOf(unit.name)),
} as const;

const wrapMomentGetter = <T>(f: (m: Moment) => T) => (
  d: Date,
  { tzName }: TZ
) => f(moment(d).tz(tzName));

const weeksInYear = () => wrapMomentGetter((m: Moment) => m.weeksInYear());
const isoWeeksInYear = () =>
  wrapMomentGetter((m: Moment) => m.isoWeeksInYear());
const format = (spec: string) =>
  wrapMomentGetter((m: Moment) => m.format(spec));
const daysInMonth = () => wrapMomentGetter((m: Moment) => m.daysInMonth());
const calendar = (d?: Date, formats?: Record<string, string>) =>
  wrapMomentGetter((m: Moment) => m.calendar(d, formats));
const diff = (d?: Date, s?: TZUnitName, b?: boolean) =>
  wrapMomentGetter((m: Moment) => m.diff(d, s, b));
const from = (d?: Date, b?: boolean) =>
  wrapMomentGetter((m: Moment) => m.from(d, b));
const to = (d?: Date, b?: boolean) =>
  wrapMomentGetter((m: Moment) => m.to(d, b));
const toNow = (b?: boolean) => wrapMomentGetter((m: Moment) => m.toNow(b));
const fromNow = (b?: boolean) => wrapMomentGetter((m: Moment) => m.fromNow(b));

/**
 * All the built-in getters _constructors_.  They take some number of parameters and
 * return a getter that can be passed to `extract()`.
 * These are taken from Moment.js.
 * You can create your own getter, of course: a function of type `TZGetter<T>`,
 * which means it takes a Date and a TZ as arguments and returns whatever you like.
 */
export const getters = {
  weeksInYear,
  isoWeeksInYear,
  format,
  daysInMonth,
  calendar,
  diff,
  from,
  to,
  toNow,
  fromNow,
  ...setters,
} as const;

export const UTC = getTZ("UTC");

export const SystemTZ = getTZ(moment.tz.guess());
