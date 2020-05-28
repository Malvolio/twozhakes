# Why moment.js is terrible and how we can fix it

Moment.js, the almost universally used library in Javascript and Typescript for calendar manipulation, is an impressive product
in many ways. It does, however, have two really critical problems that should make any sensible engineer reluctant to use it directly.

## Why Moment.js is terrible

### Problem 1: Moments are mutable

There are probably two lessons that software engineering as a profession has learned over the last decade. One is that types are important to reliable software, and Moment.js has good typing available.

The other thing though is that mutability is huge and usually unnecessary burden on development.

Moment.js reifies any particular moment in time as a Moment. Moments are mutable, and it’s terrible. For example, consider the following piece of code:

```typescript
function f(m: moment.Moment, p: () => void): number {
  const y1 = m.year();
  p();
  const y2 = m.year();
  return y2 - y1;
}
```

Let’s ask, what will this function return?

The naive answer would be 0. I am asking what is the difference between what year it was on Moment and the year of that same Moment two lines later. The naive answer, but it would be right if it were not for the insane ball of garbage that is mutability. Imagine this function is called by the following function:

```typescript
function g(): number {
  const m = m.year();
  return f(m, () => {
    m.add(3, "years");
  });
}
```

Now `f` returns 3. The value of Moment can change at almost any time, and when it does, you will not know why. Things just _happen_.

### Problem 2: Timezones are a trainwreck

Most people get timezones wrong. The issues are complicated, and timezones were something of an afterthought to Moment.js. They bolted it on and bolted it on wrong. To understand the issue requires that you understand time and timezones:

## Understanding time and timezones

### What is time?

Some of the smartest people in the world have spent their whole lives
answering that question. I am not that smart and in more of a hurry,
so let me give a very short version

_[for the first time in my career, I have reason to use of the expression “ignoring relativistic effects”, but if I did, I would have to use it in almost every sentence, so I’m going to rely on you, the reader, to assume it is there if it matters._

Time is the infinite sequence of “now” in which we live, and which we wish to name and to count.

### What is now?

We have a common sense of “now”. If you call your friend in Tokyo or Helsinki or Timbuktu, it might be noon or bedtime, but it’s still the same now, and an hour from now, the two of you will be share the new now of that time.

This issue is, what do we call that now?

Over the years, we’ve developed several universal schemes for naming each now — universal in the sense that the name is applicable anywhere in the world, not in the sense it is universally understood.

One is time is Unix time, which counts in the number of seconds since an “epoch,” a point arbitrarily set about 50 years ago. As it write this, it is 1590605259055 milliseconds since epoch, so whatever advantages Unix time has, it isn’t terribly readible.

Another universal format is Zulu. Right now it’s 2020-05-27T18:47:39.055Z, which is a little better: you know what year it is, and you can calculate the month (five is... May, right?) but you don’t have any sense of where I am in my day. Am I having dinner or fast asleep?

### Timezones?

Because the interpretation of time is so colored by where we are, the world is divided up into time zones. Each zone gives a way to name now so that it can be easily understood and appreciated.

In my example, my zone, called the “America/Los Angeles” zone, renders the current time, 1590605259055 in Unix time, as 11:47 in the morning. During the summer, this zone is in Pacific Daylight Time, 8 hours behind Zulu.

Your timezone is your location is _space_, and governs how time is conventionally rendered where you are. It does not affect what time it is, just what you call the time.

## So what is wrong with how Moment.js handles timezones?

I think the writers of Moment.js misjudged how fundamental timezones are. Most of what they are doing only makes sense in the context of a timezone. For example, consider the method `.startOf("day")`. Today started 12 hours ago — if you’re here in California. In Hawai‘i, the day started on nine hours ago. Or consider `.endOf("hour")`. The current hour will end in 13 minutes here, and in New York and Honolulu — but in Mumbai, it has 43 minutes left to run.

Having belatedly (ha-ha) realized that timezones are important, Moment.js managed to do exactly the wrong thing. It made it possible (although not obligatory) to associate a Moment with a timezones and any manipulation of that Moment are thereafter done in the context of that zone.

Which is exactly backwards. A point in time is universal. ARight now, it is now where I am and where you are and all around the world. The timezone cannot influence what time it is, only the name you give that time and how you make calculations about that time.

But it’s mandatory! Questions like “when did the day start?” do not even make sense unless you already know not only what time it is, but where you are.

## What should be done?

Javascript already has a usable way of representing points in time: the Date object. It is far from perfect — it carries with it a lot of baggage that you need to ignore — but it represents each point of time in an unique and unmistakeable way.

What we need is a strong representation of timezone. Not just a labeling of the zone, but a mechanism that performs all the Moment.js manipulation of time — parsing strings into Dates, formating Dates into strings, doing math on dates — in a functional, composable, and correct fashion.

## Is that not a lot of work?

Super easy, barely an inconvenience. I myself implemented it almost completely in about two hours. Of course, I made liberal use of Moment.js underneath (why reinvent the wheel, after all?) but in a way that all the mistakes in its design do not come to light. It is called [twozhakes](https://github.com/Malvolio/twozhakes) and you should check it out.
