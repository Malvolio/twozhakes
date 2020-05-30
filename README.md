# twozhakes

Improved façade for Moment.js

Unlike Moment.js, twozhakes is functional and composable and most important, _does timezones right_.

Or more right. Who knows?

## Motivation

Read the complete rant [here](https://github.com/Malvolio/twozhakes/blob/master/docs/rant.md), but to summarize:

- Moment.js isn’t [functional](https://en.wikipedia.org/wiki/Functional_programming)
- Moment.js isn’t composable
- Moment.js gets timezones wrong

## Getting Started with twozhakes

### Installation

Standard deal:

```sh
yarn add twozhakes
```

or

```sh
npm install twozhakes
```

### Using twozhakes

Everything in twozhakes revolves around the `TZ`, which encapsulates the timezone and hosts all the actual work.

First, you need a TZ, either by using one of the standard TZs, `SystemTZ` or `UTC`, or by asking for it by name:

```typescript
const tz = getTZ("America/New_York");
```

`TZ` only offers three methods, the first of which is `parse()`:

```typescript
const tz = getTZ("America/New_York");
const d = tz.parse("2020-02-05");
```

`parse()` uses all [the parsing from Moment.js](https://momentjs.com/docs/#/parsing/) to returns a standard JavaScript `Date`. In fact, all work in twozhakes is done using `Date` objects. The `Date` class is far from perfect, but it is compact, it is unambiguous, it measures time in exactly the right way (Unix time), and it prints out nicely.

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
const m = tz.extract(d, month); // 1, February (months are zero based!)
const nm = tz.extract(nd, month); // 2,  March
```

There are a lot of extractors, but the most important one is `format()`, which extracts data as formatted strings, using the [same formatting language as Moment.js](https://momentjs.com/docs/#/displaying/format/).

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

## Examples

The source code has [two examples](https://github.com/Malvolio/twozhakes/tree/master/src/demo):

- _next_ — two new operators, one to skip ahead to the next occurance of a given day of the week and the other for the month of the year
- _election_ — an operator to skip ahead to the next US election

## Open Questions

### 1. Units

Right now, the unit constructors can be used as getters directly, like this:

```typescript
const m = tz.extract(d, month);
```

Should they have to be invoked without arguments, to suggest the pattern from Moment.js?

```typescript
const m = tz.extract(d, month());
```

### 2. Plural forms

Right now, the units and other setters are only defined in the singular, `millisecond`, `year`, etc. Should twozhakes also support plurals?

### 3. Invoking the built-in operators

Right now, all the built-in operatos are constructed with unit-values, like so:

```typescript
const nd = tz.operate(d, add(month(1)), startOf(month));
```

Would it make more sense to associate the operators directly with the unit-values, like so:

```typescript
const nd = tz.operate(d, month(1).add, month.startOf);
```

or does that just look funny?

### 4. Custom units

Is there any need to support the ability to create custom units -- `fortnight`, `century`? This becomes much easier if Question 3 is answered with Yes.

### 5. Namespacing

Right now, the constants are all kept in their own pseudo-namespaces: `setters`, `getters`, and `operators`.

```typescript
import { TZ, operators, TZUnit, units } from "../lib";
const { set, startOf, add } = operators;
const { day, week, month, year } = units;
```

Is this worthwhile or does it just make importing more difficult?
