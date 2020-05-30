import { UTC, getters } from "../lib";
import { nextElectionDay } from "./election";
const { format } = getters;

test("in 2016, the election fell on the 8th", () => {
  const today = UTC.parse("2015-10-01");
  const electionDay = UTC.operate(today, nextElectionDay);
  expect(UTC.extract(electionDay, format("yyyy-MM-DD"))).toBe("2016-11-08");
});

test("after the election in 2020,  the next election will not be until 2022", () => {
  const today = UTC.parse("2020-12-01");
  const electionDay = UTC.operate(today, nextElectionDay);
  expect(UTC.extract(electionDay, format("yyyy-MM-DD"))).toBe("2022-11-08");
});
