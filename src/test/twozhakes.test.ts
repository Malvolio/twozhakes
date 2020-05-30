import {
  UTC,
  SystemTZ,
  operators,
  units,
  setters,
  getTZ,
  getTZSetter,
  getters,
} from "../lib";

const { day, hour, month, year } = units;
const { add, set, subtract, startOf } = operators;
const { date } = setters;
const { format, isoWeeksInYear, from } = getters;

const TestDate = 1583586000000;
const TestDateString = "2020-03-07T13:00:00Z";

test("can parse date", () => {
  const d = SystemTZ.parse(TestDateString);
  expect(d.getTime()).toBe(TestDate);
});

test("can format date", () => {
  const d = UTC.extract(TestDate, format("YYYY-MM-DD"));
  expect(d).toBe(TestDateString.substring(0, 10));
});

test("can format date in LA", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.extract(TestDate, format("YYYY-MM-DD hh:mm"));
  expect(d).toBe("2020-03-07 05:00");
});

test("can add hours", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.operate(TestDate, add(hour(24)));
  expect(d.toISOString()).toBe("2020-03-08T13:00:00.000Z");
});

test("can add days", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.operate(TestDate, add(day(1)));
  // note we have lost an hour, as DST ended!
  expect(d.toISOString()).toBe("2020-03-08T12:00:00.000Z");
});

test("can subtract days and set hours", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.operate(TestDate, subtract(day(1)), set(hour(3)));
  // 3am in LA is 11 in UTC (in winter)
  expect(d.toISOString()).toBe("2020-03-06T11:00:00.000Z");
});

test("can extract hours", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.extract(TestDate, hour);
  expect(d).toBe(5);
});

test("can extract days", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.extract(TestDate, day);
  expect(d).toBe(6); // It is Saturday
});

test("can extract date", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.extract(TestDate, date);
  expect(d).toBe(7); // It is 7th of the month
});

test("can extract isoWeeksInYear", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.extract(TestDate, isoWeeksInYear());
  expect(d).toBe(53);
});

test("can extract 'from'", () => {
  const tz = getTZ("America/Los_Angeles");
  const d0 = tz.operate(TestDate, add(day(95)));
  const d = tz.extract(TestDate, from(d0));
  expect(d).toBe("3 months ago");
});

test("can find date setter", () => {
  const foundDate = getTZSetter("dates");
  expect(foundDate).toBe(date);
});

test("some general manipulation", () => {
  const tz = getTZ("America/New_York");
  const d = tz.parse("2020-02-05");
  const nd = tz.operate(
    d,
    add(month(1)),
    startOf(month),
    startOf(day),
    set(hour(9))
  );
  expect(tz.extract(nd, year)).toBe(2020);
  expect(tz.extract(d, month)).toBe(1);
  expect(tz.extract(nd, month)).toBe(2);
  expect(tz.extract(nd, format("dddd, MMMM Do YYYY, h:mm:ss a"))).toBe(
    "Sunday, March 1st 2020, 9:00:00 am"
  );
});
