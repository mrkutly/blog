---
title: "Unknown vs Any"
date: "2022/06/05"
author: "Mark Sauer-Utley"
blurb: "Why unknown is the better choice between Typescript's top types."
---

![typescript logo](/images/tslogo.png)

If you read [this doc about exhaustive switch statements](/absurd), then you are already familiar with `never`​, which is Typescript's **bottom type.** In type theory, the bottom type is a type that has no values (meaning nothing is of that type). The inverse is true of **top types**, in that all values in a type system are members of the top type. [Since Typescript 3.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type), we actually have 2 top types: `unknown`​ and `any`​.

--- 

## Any → the yolo type

`Any`​ is an escape hatch in TS. It allows you to completely bypass the type system and write whatever code you want. Over-use of `any`​ defeats the purpose of using a statically typed language at all, as it is essentially just writing JS but with more steps. A value of type `any`​ can be treated as a number, string, function, object, whatever we want. We can also access any members of it and they will also be of type `any`​.

From the typescript docs:

> The `any` type is useful when you don’t want to write out a long type just to convince TypeScript that a particular line of code is okay.

Basically, it's the "_F\*$ck this! I give up_" type or the "_move fast and break things_" type. We really shouldn't use it, but sometimes we are under too much pressure to ship something or are just feeling a bit lazy that day, so we turn to it.

The problem with `any`​ is that it rears its ugly head later when you are trying to refactor code or add new features. If something is typed as `any`​, the compiler will let you do anything you want with it. It also makes it so the type system won't help future devs who come to this code.

So what do we do? Well, if we know what the type of something is, we write that as the type! But what if we _don't know_ what the type of something is?

--- 

## Unknown → the idk, we'll figure it out later type

`Unknown`​, the other **top type** is TS, is the type-safe alternative to `any`​. Any value can be assigned to an `unknown`​, but you _**cannot**_ _**use that value unless you narrow it's type**_. So if you want to treat it as a function, you have to check that it is a function. If you want to treat it as a string, you have to check that it is a string.

This is way safer than using `any`​, but you still get the flexibility that `any`​ gives you. For example, say you need to parse some JSON and use that object.

```typescript
const riskyParse = (s: string): any => {
  return JSON.parse(s)
}

const safeParse = (s: string): unknown => {
  return JSON.parse(s)
}

const safeObj = safeParse(someRandomString)
const riskyObj = riskyParse(someRandomString)

// we need to use type-narrowing on safeObj
if (Array.isArray(safeObj)) {
  const first = safeObj[0]
}

if (typeof safeObj === 'string') {
  const upper = safeObj.toUpperCase()
}

// but on riskyObj, anything goes
riskyObj * 1000
riskyObj.super.nested.keys
riskyObj[1][2][3]
```

---

## Refactoring an example

Let's say we have some function called `getId`​. This function accepts _something_ and returns its `id`​, if it has one. This is going to get called on some JSON that we parse from a web-hook, so **we** **really do not know** what the input will look like. It's currently implemented like this:

```typescript
const getId = (x: any) => x.id
```

Ah shit! We just got a sentry error that lets us know this function was called with `null`​. Ah more shit! We just got 40 sentry errors because this function returned `undefined`​ in several places in our application, but since the return type was `any`​, we were treating those as numbers, passing them to more functions expecting numbers, causing a domino effect of failures! What the hell?!? Isn't typescript supposed to prevent this type of stuff?

How could we refactor this function to be both re-usable **and** type-safe?

```typescript
const getId = (x: unknown) => {
  if (typeof x === 'object') {
    return x.id
  }
}
```

Nice! Wait, this doesn't work. Crap. Why? Let's check the compiler error:

```typescript
const getId = (x: unknown) => {
  if (typeof x === 'object') {
    return x.id
    // => Object is possibly 'null'. 
  }
}
```

Oh right, in JS, `typeof null`​ returns `'object'​`​ (brilliant language design). Let's check for that.

```typescript
const getId = (x: unknown) => {
  if (!!x && typeof x === 'object') {
    return x.id
    // => Property 'id' does not exist on type 'object'
  }
}
```

What the heck? Okay, okay. We got this. Let's just check that `id`​ is a key of `x`​.

```typescript
const getId = (x: unknown) => {
  if (!!x && typeof x === 'object' && 'id' in x) {
    return x.id
    // => Property 'id' does not exist on type 'object'
  }
}
```

Fuck this, I'm using `any`​.

No! Don't do that! We can get through this together!

Unfortunately, TS is not quite smart enough to understand this code. Instead, we need to use a [**type-guard**](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates). Let's write one!

```typescript
const hasId = <T extends object>(x: T): x is T & { id: unknown } => {
  return 'id' in x
}

const getId = (x: unknown) => {
  if (typeof x === 'object' && !!x && hasId(x)) {
    return x.id
  }
}
```

Finally, it compiles! I admit, this is a bit awkward and cumbersome, and I don't want to have to do this stuff every time I need to access members on an `unknown`​. Let's write some helpers!

```typescript
type UnknownVals<K extends string> = Record<K, unknown>
type HavingProperty<K extends string, T extends object> = 
  T & UnknownVals<K>

const isNonNullObject = (x: unknown): x is object => (
  !!x && typeof x === 'object'
)

const hasProperty = <K extends string, T extends object>(
  key: K,
  x: T
): x is HavingProperty<K, T> => {
  return key in x
}

const isObjectWithProperty = <
  K extends string,
  T extends object
>(key: K, x: unknown): x is HavingProperty<K, T> => (
  isNonNullObject(x) && hasProperty(key, x)
)
```

This might look a bit bananas (I agree, TS is not the most ergonomic language), but luckily we can write this once and use it anywhere! Let's use this to make `getId`​ way nicer.
​
```typescript
const getId = (x: unknown) => {
  if (isObjectWithProperty('id', x)) {
    return x.id
  }
}
```
  

Great! Now, this function either gets the `id`​ (which will also be of type `unknown`​) or it returns `undefined`​. This means it is not only type-safe within its function body, but it's **return value will also be type-safe**. So not only did we fix that first sentry error where the input for this function was `null`​, we know have the compiler yelling at us to fix the other 40 places where we got errors because the output was `undefined`​ and being treated as `any`​.

## That's all!

Here is a link to this code in the [TS playground](https://www.typescriptlang.org/play?ssl=22&ssc=2&pln=1&pc=1#code/MYewdgzgLgBAlhAcuRBXANug8gIwFYCmwsAvDABQAeAXDKmANZggDuYAlLZfBDCPkVIA+CgFgAUDBgBCadwBk8mFACeABwIgAZjG4l9MAOT9CxQxPYSJqjTACqjZmwBqAQ3QQAPAGkYBSlAEYAAmvNAATnBgAOYiZABKRCDhwT4ANHSOrGBCVuI2BDAAEq4AblHRAArhIBrhqj5+AUGhMBEVGQAqTYEhvCaCcTASUt1KDkzZbh4+ueISoJCwABauENW1BPUqMGSN-r2t7TFdPS39AsRC5CMwDAQqtN5ptzQwnRZcPMVlFRt1DWe7ziIgA3rdwgQoKhwmA7g94HDKBIAL55RbQHi4UxQADqcCgy3+W1UuxgnluvgO5zaUEiJ1u3WpfT4lygEmu90eMCBb3okzYnF03xK5RixO26WBuxEN0kPGQYDQmGxgio7Bgihgq3WNQBKnIXIylEs4lNC3AmOiUIAksEyVRaPynBwZTBwfK4DpyAhVcR8YSJapyIY4MFDMb2BqPVIpJDobDdAA6MO3NHiFFAA) if you would like to play with it. Thanks for reading!