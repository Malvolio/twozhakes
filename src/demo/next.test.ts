import { SystemTZ, getters } from "../lib";
import { nextDayOfWeek, nextMonth } from "./next";

const { format } = getters;

const thisMonday = "2020-03-30";
const thisThursday = "2020-04-02";
const thisFriday = "2020-04-03";
const nextThursday = "2020-04-09";

test("can find Thursday from Monday", () => {
  const today = SystemTZ.parse(thisMonday);
  const thursday = SystemTZ.operate(today, nextDayOfWeek(4));
  expect(SystemTZ.extract(thursday, format("YYYY-MM-DD"))).toBe(thisThursday);
});

test("can find Thursday from Friday", () => {
  const today = SystemTZ.parse(thisFriday);
  const thursday = SystemTZ.operate(today, nextDayOfWeek(4));
  expect(SystemTZ.extract(thursday, format("YYYY-MM-DD"))).toBe(nextThursday);
});

test("can find Thursday from Thursday", () => {
  const today = SystemTZ.parse(thisThursday);
  const thursday = SystemTZ.operate(today, nextDayOfWeek(4));
  expect(SystemTZ.extract(thursday, format("YYYY-MM-DD"))).toBe(nextThursday);
});

test("can find Thursday from Thursday (inclusive)", () => {
  const today = SystemTZ.parse(thisThursday);
  const thursday = SystemTZ.operate(today, nextDayOfWeek(4, true));
  expect(SystemTZ.extract(thursday, format("YYYY-MM-DD"))).toBe(thisThursday);
});

const lateMarch = "2020-03-30";
const firstOfApril = "2020-04-01";
const firstOfMay = "2020-05-01";
const nextApril = "2021-04-01";

test("can find April from March", () => {
  const today = SystemTZ.parse(lateMarch);
  const april = SystemTZ.operate(today, nextMonth(3));
  expect(SystemTZ.extract(april, format("YYYY-MM-DD"))).toBe(firstOfApril);
});

test("can find April from May", () => {
  const today = SystemTZ.parse(firstOfMay);
  const april = SystemTZ.operate(today, nextMonth(3));
  expect(SystemTZ.extract(april, format("YYYY-MM-DD"))).toBe(nextApril);
});

test("can find April from April", () => {
  const today = SystemTZ.parse(thisThursday);
  const april = SystemTZ.operate(today, nextMonth(3));
  expect(SystemTZ.extract(april, format("YYYY-MM-DD"))).toBe(nextApril);
});

test("can find April from April (inclusive)", () => {
  const today = SystemTZ.parse(thisThursday);
  const april = SystemTZ.operate(today, nextMonth(3, true));
  expect(SystemTZ.extract(april, format("YYYY-MM-DD"))).toBe(firstOfApril);
});
