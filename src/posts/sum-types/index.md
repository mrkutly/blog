---
title: "ADT's and polymorphism"
date: "2022/06/01"
author: "Mark Sauer-Utley"
blurb: "Write better types for your business logic using using sum types."
---

![typescript logo](../unknown-vs-any/images/tslogo.png)

## What is an ADT?

An ADT (**algebraic data type)** is basically a type made of other types. There a multiple types of ADT's, but the one we care about here is called a **sum type**. A sum type is a type where a value must be one of a fixed set of types. For example, an `Animal`​ type that could be a `Cat`​ type or a `Dog`​ type would be a **sum type**. It cannot be both a `Cat`​ and a `Dog`​ at the same time.

## Why do I care?

Well, it turns out that this concept is incredibly powerful and allows us to write very strict type definitions to model our business domain. A great use case for this is implementing types for a polymorphic relationship. For example, the `Favorite`​ type has a `favoritable`​ relationship that can be a `Photo`​, `Post`​, or `Group`. It can never be both a `Photo`​ and a `Post`​, or any other combo. It must only be one of those (thus it is a **sum type**).

Let's look at some code!

## Example - Favorite model without ADT

Let's say we implemented the ​`Favorite`​ type as a regular interface that handles all the possible types. Notice there are a lot of union types (types with ​`|`​ in them) being used.

```typescript
// this is based on a real example from a project I work on.
// the domain has been changed for ease of understanding.

interface Favorite {
  favoritable_emoji: string | null
  favoritable_id: string | number
  favoritable_title: string
  favoritable_type: 'Photo' | 'Post' | 'Group'
  id: number
  favoritable_slug: string | null
}
```

This is sort of correct, right? Nothing in there is untrue. `favoritable_id`​ is a `string`​ or a `number`​. But really, `favoritable_id`​ is a `string`​ when the `favoritable_type`​ is `Post`​ or `Group`​, and a `number`​ when the `favoritable_type`​ is a `Photo`​.

This is an important distinction to make for a few reasons:
1.  I have to know that in my brain, which is an unreliable chunk of meat.
2.  We have to use type casting (i.e. ​`favorite.favoritable_id as string`​) to make our code compile, which means our types are not correct and breaking changes will not get caught by the compiler, which defeats the purpose of using types at all.

Let's say we want to get the url for each of these types. If we use this sort-of-correct type definition, we end up with code like this:
```typescript
const pathForFavorite = (favorite: Favorite) => {
  switch (favorite.favoritable_type) {
    case 'Post':
      if (favorite.favoritable_slug) {
        return generatePath(POST_PATH, {
          slug: favorite.favoritable_slug
        })
      }
      else {
        return ''
      }
    case 'Photo':
      return generatePath(PHOTO_PATH, {
        id: favorite.favoritable_id,
      })
    case 'Group':
      return generatePath(GROUP_PATH, {
        location: favorite.favoritable_id,
      })
  }
}
```
  
Notice how we need to check for the presence of `favoritable_slug`​ before using it? This is because we said it was `string | null`​, but in reality, it should never be `null`​ when the type is `Post`​. Those `if`​ statements are just ceremony to get the code to compile because we didn't define our `Favorite`​ type correctly.

The alternative would be to use `!`​ to cast `string | null`​ into just `string`​. This is less code, but still problematic because it means we (the developers) know that our types are incorrect, and are trusting our memory and discipline to always write perfect code.

Let's fix this!

## Example - Favorite model with ADT

Here's how we can define our `Favorite`​ type using and ADT (in Typescript, these are called **discriminated union** types). This is more code in our type definition, but it is also more correct, which is way more important than brevity.

```typescript

interface BaseFavorite {
  favoritable_emoji: string | null
  favoritable_title: string
  id: number
}

interface PostFavorite extends BaseFavorite {
  favoritable_id: string
  favoritable_type: 'Post'
  favoritable_slug: string
}

interface PhotoFavorite extends BaseFavorite {
  favoritable_id: number
  favoritable_type: 'Photo'
  favoritable_slug: null
}

interface GroupFavorite extends BaseFavorite {
  favoritable_id: string
  favoritable_type: 'Group'
  favoritable_slug: null
}

type Favorite = 
  | PostFavorite
  | PhotoFavorite
  | GroupFavorite
```

Nice! Now I, the developer looking at this code, know everything about this model. I know when the `favoritable_id`​ is `string`​ and when it is a `number`​. I know when there is a `favoritable_slug`​ and when there isn't. I also know that the `favoritable_emoji`​ is optional for every favorite type (and not required on some and missing on others, like the slug is).

The best part of this is that my application code can be way less ceremonious and I know that, if I am typecasting or using `!`​ for anything, I am doing something wrong.

Let's look at that `pathForFavorite`​ function again:​

```typescript
const pathForFavorite = (favorite: Favorite) => {
  switch (favorite.favoritable_type) {
    case 'Post':
      return generatePath(POST_PATH, {
        slug: favorite.favoritable_slug
      })

    case 'Photo':
      return generatePath(PHOTO_PATH, {
        id: favorite.favoritable_id,
      })

    case 'Group':
      return generatePath(GROUP_PATH, {
        location: favorite.favoritable_id,
      })

    default:
      absurd(favorite)
      return ''
  }
}
```
  
Now we have no typecasting and none of the `if`​ statements (which were just there to make the compiler happy).

We also were able to add the `absurd`​ function to [ensure that the switch statement is exhaustive](/absurd) and future updates to this model (like adding another `FavoritableType`​) will prevent this function from compiling without handling the new `Favorite`​ type. The `absurd`​ function is defined as a function that requires a single argument of type `never`​, meaning that it can never be called.

```typescript
const absurd = (x: never) => {}
```

## That's it!

Thanks for reading!