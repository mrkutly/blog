---
title: "Smart Constructors"
date: "2022/06/04"
author: "Mark Sauer-Utley"
blurb: "Compile time validation on runtime data."
---

![typescript logo](../unknown-vs-any/images/tslogo.png)

## What is a smart constructor?

A smart constructor is a way of instantiating a type using **runtime** checks on the value. Sometimes you need guarantees about the values in your program beyond what can be accomplished with the usual compile-time type system checks. Smart constructors can be used for this!
  
Note that in TS, smart constructors will need to be used with [Opaque Types](/opaque-types). This is because Typescript focuses on the _shape_ of types (duck typing) rather than where they came from (the way Haskell or other typed languages do).

## A Less Smart Example

Let's say we have some type, `Dog`​, that looks like this:

```typescript
export type Dog = {
  name: string
  breed: string
  age: number
}
```

We'll build a UI component that shows this dog's info. It shows the name, breed, age, and age in dog years (age * 7).

```tsx
// dog type module
export type Dog = {
  name: string
  breed: string
  age: number
}

​
// DogComponent module
const DogComponent = ({ dog }: { dog: Dog }) => (
  <>
    <h1>{dog.name}</h1>
    <p>{dog.breed}</p>
    <p>Age (Human years): {dog.age}</p>
    <p>Age (Dog years): {dog.age * 7}</p>
  </>
)
```

Nice! Let's ship it 🚀

Wait, what if at some point, we got a dog that has a negative age? Or maybe the breed is just an empty string? In the world of web development, anything is possible. How could we ensure that our `DogComponent`​ only ever received dogs with positive ages and non-empty strings? And what about creating dogs? We might have some API module with functions for creating, batch-creating, and updating dogs. We'll want to ensure those functions only ever receive valid dogs as well!

## Enter → Smart Constructors

Let's do some fun type magic to ensure that this is never possible. We'll do so by creating two opaque types: `PositiveNumber`​ and `NonEmptyString`​.
  
```tsx
import { Opaque } from 'types'

declare const NonEmptyStringS: unique symbol
declare const PositiveNumberS: unique symbol

export type NonEmptyString = Opaque<string, typeof NonEmptyStringS>
export type PositiveNumber = Opaque<number, typeof PositiveNumberS>
​
export type Dog = {
  name: NonEmptyString
  breed: NonEmptyString
  age: PositiveNumber
}
```  

Great! Now we have these opaque types! Now how do we create them? Well, we just need to be disciplined about not using typecasting to instantiate these types (i.e. `someNonsense as NonEmptyString`).

Typescript is full of escape hatches to allow interop with JS, but we need to be careful not to use those features to keep from having to do things correctly!

To create these types, we'll add smart constructors which we we will from this module.

```typescript
import { Opaque } from 'types'

declare const NonEmptyStringS: unique symbol
declare const PositiveNumberS: unique symbol

export type NonEmptyString = Opaque<string, typeof NonEmptyStringS>
export type PositiveNumber = Opaque<number, typeof PositiveNumberS>
​
export type Dog = {
  name: NonEmptyString
  breed: NonEmptyString
  age: PositiveNumber
}
​
type DogParams = {
  age: number
  name: string
  breed: string
}

// these are just helpers for implementing a Maybe monad
type Some<T> = { _tag: 'some', val: T }
type None = { _tag: 'none' }
type Maybe<T> = Some<T> | None

const none = (): None => ({ _tag: 'none' })
const some = <T>(val: T): Some<T> => ({ _tag: 'some', val })
const isSome = <T>(x: Maybe<T>): x is Some<T> => x._tag === 'some'
const isNone = (x: Maybe<unknown>): x is None => x._tag === 'none'

// these are our smart constructors
export const maybeNonEmptyString = (x: string): Maybe<NonEmptyString> => (
  x.length === 0 ? none() : some<NonEmptyString>(x)
)

export const maybePositiveNumber = (x: number): Maybe<PositiveNumber> => (
  x < 0 ? none() : some<PositiveNumber>(x)
)
​
export const maybeDog = (x: DogParams): Maybe<Dog> => {
  const name = maybeNonEmptyString(x.name)
  const breed = maybeNonEmptyString(x.breed)
  const age = maybePositiveNumber(x.age)
  if (isSome(name) && isSome(breed) && isSome(age)) {
    return some<Dog>({ name: name.val, breed: breed.val, age: age.val })
  } else {
    return none()
  }
}
```

Great! Now we have smart constructors for both our opaque types and our `Dog`​ type.

Now, it is **impossible** to pass `DogComponent`​ a dog with an empty name, empty breed, or negative age _**without using typecasting**_. Let's look at how our dog fetching (lol) code can use the `maybeDog`​ function to type-safely return dogs:

```typescript
import { useQuery } from 'react-query'
import { maybeDog, Dog, isNone } from 'dog-module'
​

const useDogs = () => {
  return useQuery<Dog[]>('dogs', async () => {
    const res = await fetch('/dogs')
    const json = await res.json()
    return json.dogs.map(maybeDog).filter(isNone).map(x => x.val)
  })
}
```

Nice. Now when we fetch dogs from the API, we filter out any possible corrupt data to ensure our app doesn't break.

Let's look at how we can also use this type to create a dog from a form!

```tsx
// dog api
import { Dog } from 'dog-module'
​
export const saveDog = (dog: Dog) => {
  // just gonna send it
}

// dog form component
import { maybeDog, isSome, isNone } from 'dog-module'
import { saveDog } from 'dog-api-module'
​
const DogForm = () => {
  const [formState, setFormState] = useState({
    name: '',
    breed: '',
    age: 0,
  })

  const dog = maybeDog(formState)
  const onSubmit = (e) => {
    e.preventDefault()
    if (isSome(dog)) saveDog(dog.val)
  }

  return (
    <form onSubmit={onSubmit} method="POST">
      // ya know, inputs and such ...
      <button type="submit" disabled={isNone(dog)}>Save Dog!</button>
    </form>
  )
}
```

Hey that works pretty good. Now we know that this form can never send empty strings or or negative numbers to the API.

## Benefits of this approach

### Validation

You may be thinking, "ya, but we can do that with formik or something". My response to that would be, "yes, but this is now checked at **compile time**", which means that **we cannot break this** in the future without the **compiler** telling us about it. That's pretty sick IMO.

### Less defensive programming

With smart constructors, we don't have to do **ad-hoc defensive programming**. Without the compiler checks for valid data, it is very easy to end up in a situation where you have validation sprinkled all over the code base.

For example, you might be validating this data in the form and showing users error messages, but the `saveDog`​ function doesn't know that. So you will probably add the same validation again in the `saveDog`​ function, just to be sure. And what about `DogComponent`​? Does `DogComponent`​ now need to handle empty strings and negative numbers? I don't know. Maybe? Probably not? I am not confident.

Now, you're doing unnecessary validation that could have just been enforced by the compiler using a smart constructor. You also now have **two sources of truth** for the validation, which can easily lead to bugs as new requirements are added to this feature. For example, Josh hits you up and says dog names now have to be at least 3 characters. Now we have to update the validation in two places, maybe more! And we can't actually be confident we caught it all without manual testing. If we were using smart constructors, we could be **way more confident** that our changes will be safe.

## That's all! Further reading here:

*   [Smart constructors + fp-ts = 😍](https://dev.to/gcanti/functional-design-smart-constructors-14nb)    
*   [Validation with smart constructors](https://haskell-at-work.com/episodes/2018-02-26-validation-with-smart-constructors.html) (a haskell blog, but a good read!)