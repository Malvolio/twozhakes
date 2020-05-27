import {
  UTC,
  SystemTZ,
  operators,
  units,
  setters,
  getTZ,
  getTZSetter,
} from "../lib";

const { day, hour } = units;
const { add, set, subtract } = operators;
const { date } = setters;

const TestDate = 1583586000000;
const TestDateString = "2020-03-07T13:00:00Z";

test("can parse date", () => {
  const d = SystemTZ.parse(TestDateString);
  expect(d.getTime()).toBe(TestDate);
});

test("can format date", () => {
  const d = UTC.format(TestDate, "YYYY-MM-DD");
  expect(d).toBe(TestDateString.substring(0, 10));
});
test("can format date in LA", () => {
  const tz = getTZ("America/Los_Angeles");
  const d = tz.format(TestDate, "YYYY-MM-DD hh:mm");
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

test("can find date setter", () => {
  const foundDate = getTZSetter("DATES");
  expect(foundDate).toBe(date);
});
