---
title: "Exhaustive Switch Statements in Typescript"
date: "2022/06/02"
author: "Mark Sauer-Utley"
blurb: "Prevent holes in your application with exhaustive type checking."
---

![typescript logo](../unknown-vs-any/images/tslogo.png)

## The problem

When using sum types, you will probably find yourself writing a lot of code like this:

```typescript
interface Dog {
  type: 'dog'
  age: number
}

interface Cat {
  type: 'cat'
  age: number
}

export type Animal = Cat | Dog

// some other file somewhere else
const getAgeInAnimalYears = (animal: Animal) => {
  switch (animal.type) {
    case 'dog':
      return animal.age * 7
    case 'cat':
      return animal.age === 1 ? 24 : 24 + animal.age * 5
  }
}
```

This is great for now, but what happens when you add `Elephant`​ as another animal type? Let's see:

```typescript
interface Dog {
  type: 'dog'
  age: number
}
​
interface Cat {
  type: 'cat'
  age: number
}
​
interface Elephant {
  type: 'elephant'
  age: number
}
​
export type Animal = Cat | Dog | Elephant
​

// Oh no! This is just going to return undefined!
const getAgeInAnimalYears = (animal: Animal) => {
  switch (animal.type) {
    case 'dog':
      return animal.age * 7
    case 'cat':
      return animal.age === 1 ? 24 : 24 + animal.age * 5
  }
}
``` 

Now our `getAge`​ function is going to return undefined for `Elephant`​s. We could have prevented this from exploding in our faces by adding a `default`​ to that `switch`​, but does that _**really**_ solve the problem? That function would have returned _**something**_, but it also would have returned something wrong, which is worse. Instead, this code shouldn't compile until we fully-implement the new animal type of `Elephant`​. How can we do that?

## Enter: never + absurd

Let's write a function called `absurd`​ that can never be called. We'll do this using the `never`​ [bottom type](https://www.typescriptlang.org/docs/handbook/2/functions.html#never).

```typescript
const absurd = (x: never) => {}
```

Since `never`​ is a type that can never be instantiated and the `x`​ argument is required here, this function is impossible to call. We can use this to ensure that our switch statement for `getAgeInAnimalYears`​ is _**exhaustive**_ (meaning it has handled all of the possible cases for `animal.type`​) by throwing it into a `default`​ clause.

```typescript
interface Dog {
  type: 'dog'
  age: number
}
​
interface Cat {
  type: 'cat'
  age: number
}
​
interface Elephant {
  type: 'elephant'
  age: number
}
​
export type Animal = Cat | Dog | Elephant
​
​
// Now this won't compile!
const getAgeInAnimalYears = (animal: Animal) => {
  switch (animal.type) {
    case 'dog':
      return animal.age * 7
    case 'cat':
      return animal.age === 1 ? 24 : 24 + animal.age * 5
    default:
      absurd(animal)
      // => Argument of type 'Elephant' 
      // is not assignable to parameter of type 'never'.
      return 1
  }
}
``` 

Great, now the compiler is showing us exactly what code we need to refactor. Let's add that case statement to handle elephants.

```typescript
interface Dog {
  type: 'dog'
  age: number
}
​
interface Cat {
  type: 'cat'
  age: number
}
​
interface Elephant {
  type: 'elephant'
  age: number
}
​
export type Animal = Cat | Dog | Elephant
​
const getAgeInAnimalYears = (animal: Animal) => {
  switch (animal.type) {
    case 'dog':
      return animal.age * 7
    case 'cat':
      return animal.age === 1 ? 24 : 24 + animal.age * 5
    case 'elephant':
      return Math.round(animal.age * 1.14)
    default:
      absurd(animal) // animal is now of type `never`
      return 1
  }
}
```

## Why do this?

The main benefit of this approach comes when it is time to refactor. If we use `never`​ to our advantage like this, refactoring code to support new types becomes trivial. We can also have a lot of confidence that, if our code compiles, it will likely work.

If we had not used `absurd`​ in this switch statement and instead had added a `default`​ that returns `1`​ or something like that, adding `Elephant`​ would have likely resulted in bugs in our business logic, affecting customers and possibly causing them to leave our platform (who wants to use an application that can't calculate elephant's ages correctly?!?!?!).

## Business-logic and compiler-driven refactoring

A way to think about this is that we are using the type system to model business logic. For example, an `Application`​ can be `pending`​, `submitted`​, or `rejected`​. It can `never`​ be anything else, and we want the compiler to enforce that. Later, we might want to add a new status, like `re-submitted`​. Imagine having to go through an entire prod codebase using text search to track down everywhere that type can surface? That sounds awful to me. Wait, I've done it before. it **is** awful. Instead, we should just be able to add that new `re-submitted`​ status and have the compiler show us everything we need update.

## That's it!

Thanks for reading!