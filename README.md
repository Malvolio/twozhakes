# twozhakes

Improved façade for Moment.js

Unlike Moment.js, twozhakes is functional and composable and most important, _does timezones right_.

Or more right. Who knows.

## Motivation

Read the complete rant [here](https://github.com/Malvolio/twozhakes/blob/master/docs/rant.md), but to summarize:

- Moment.js isn’t [functional](https://en.wikipedia.org/wiki/Functional_programming)
- Moment.js isn’t composable
- Moment.js gets timezones wrong

## Getting Started with twozhakes

Everything in twozhakes revolves around the `TZ`, which encapsulates the timezone and hosts all the actual work.

First, you get a TZ, perhaps like this:

```typescript
const tz = getTZ("America/New_York");
```

Of course, you are more likely to use a standard TZ, like `SystemTZ` or `UTC`. `TZ` only offers three methods, the first of which is `parse()`:

```typescript
const tz = getTZ("America/New_York");
const d = tz.parse("2020-02-05");
```

`parse()` using all [the parsing from Moment.js](https://momentjs.com/docs/#/parsing/) to returns a standard JavaScript `Date`. In fact, all work in twozhakes is done using `Date` objects. The `Date` class is far from perfect, but it is compact, it is unambiguous, it measures time in exactly the right way (Unix time), and it prints out nicely.

Having a `Date` object, you can manipulate it with the `operate()` method:

```typescript
const tz = getTZ("America/New_York");
const d = tz.parse("2020-02-05");
const nd = tz.operate(
  d,
  add(month(1)),
  startOf(month),
  startOf(day),
  set(hour(9))
);
```

The constant `nd` is set to the first day of the month after `d`, at 9 in the morning, Eastern time.

There are only six operators `set`, `add`, `subtract`, `startOf`, and `endOf`, and those are usually enough, but you can easily add your own.

To get information back out of a Date, there is the `extract()` method:

```typescript
const tz = getTZ("America/New_York");
const d = tz.parse("2020-02-05");
const nd = tz.operate(
  d,
  add(month(1)),
  startOf(month),
  startOf(day),
  set(hour(9))
);
const y = tz.extract(nd, year); // 2020
const m = tz.extract(d, month); // 1, meaning February (months are zero based!)
const nm = tz.extract(nd, month); // 2, meaning March
```

There are a lot of extractors, but the most important is `format()`, which extracts data as formatted strings, using the [same formatting language as Moment.js](https://momentjs.com/docs/#/displaying/format/).

```typescript
const tz = getTZ("America/New_York");
const d = tz.parse("2020-02-05");
const nd = tz.operate(
  d,
  add(month(1)),
  startOf(month),
  startOf(day),
  set(hour(9))
);
const s = tz.extract(nd, format("dddd, MMMM Do YYYY, h:mm:ss a"));
// yields "Sunday, March 1st 2020, 9:00:00 am"
```
