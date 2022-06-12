---
title: "Opaque Types - better type safety and easier to understand code"
date: "2022/06/03"
author: "Mark Sauer-Utley"
blurb: "Use opaque types to enforce application correctness."
---

![typescript logo](../unknown-vs-any/images/tslogo.png)

## What is an Opaque Type?

An **opaque type** is a type whose concrete data structure is not defined in an interface (i.e. it is not visible to the outside world). It is kind of like encapsulation but for types. For example, say you have an `User`​ type with a `id`​ field, which is a string.

You _**could**_ define your `User`​ type with `id`​ defined as a `string`​ directly (without using an opaque type), but this means **any string** could be used as a user id, no matter how you got that string or where it might come from.

Instead, you could create an opaque type called `UserId`​, which uses a `string`​ as its underlying data structure, and then say that the `User`​'s `id`​ is of type `UserId`​.

## Why do I care?

From an application code perspective, not using opaque types means it is impossible for the compiler to catch certain classes of bugs (like passing the user's `email`​ to a function expecting its `id`​​). It also means that we as developers need to know where all of our primitive data needs to come from. For example, we might have a legacy function with a signature defined as `getUser(key: string)`​ that expects the `id`​ but names it `key` locally.

Let's check out an example!

## Example - User Client

### Using transparent types

We have a file in our TS frontend code called `UserClient` that is responsible for making requests to our REST API.
Let's take a look at a couple of functions in the `UserClient`​ module - `getUser`​ and `getPost`​:​

```typescript
// based on real legacy code in an app I work on,
// shortened for brevity sake and with the domains changed

const UserClient = {
  getUser: async (id: string) => {
    return sendToApi(`/users/${id}`)
  },
  getPost: (key: string, id: string) => {
    return sendToApi(`/users/${key}/posts/${id}`)
  }
}
```
  

In the first method, we are accepting something called `id`​, which is a string. In the second, we are accepting two string args: ​`key`​, and `id`​. If we look at the usage of these args, we can _**sort-of guess**_ that the `id`​ of the first function is the same thing as the `key`​ of the second function. We can't know that for sure though unless we open up the REST API code and hunt down that endpoint to see what it does with that param.

We also then have to deal with this `id`​ param in the second function. Again, we can guess that it has something to do with the `post`​ being fetched, but we don't know for sure what `string`​ we should use (is there a `post.id`​? `post.uuid`​? `post.key`​? ​`post.someOtherThingJustHereToTrickYou`​?). Again, we have to open up the REST API code to see what is going on.

Let's see how this could be much nicer with opaque types!

### Using opaque types

```typescript
// this Opaque helper can be used to create opaque types
// don't worry about its implementation for now.
// Just know that we can use `unique symbol` to ensure
// that no two opaque types can be assigned to each other.
declare class OpaqueTag<S extends symbol> {
  private tag: S
}

export type Opaque<T, S extends symbol> = T & OpaqueTag<S>

declare const UserIdS: unique symbol
type UserId = Opaque<string, typeof UserIdS>

declare const PostIdS: unique symbol
type PostId = Opaque<string, typeof PostIdS>

interface User {
  id: UserId
  // ... the rest of it
}

interface Post {
  id: PostId
  // ... the rest of it
}

// in UserClient module
const UserClient = {
  getUser: async (id: UserId) => {
    return sendToApi(`/users/${id}`)
  },
  getPost: (key: UserId, id: PostId) => {
    return sendToApi(`/users/${key}/posts/${id}`)
  }
}
```

Now, we have a much better idea what is happening from looking at this code. We can clearly see that the `id`​ being used in `getUser`​ is the `User`​ type's `id`​ field. We also can see in `getPost`​ what models the `id`​ and `key`​ arguments come from, which again saves us valuable time double checking our assumptions against the REST API project code.

> **Note:** It is important to use the `Opaque`​ generic type to create opaque types. You may be tempted to try something like this:
> ```typescript
> type PostId = string
> ```
> Unfortunately, this just creates a _**type alias**_, which means that the compiler treats all `PostId`​ types as transparent `string`​ types.

### Compiler goodness

The magic really starts to happen when we want to use these functions. In our calling code, it is now impossible for us to pass the wrong string. Let's look at a usage example with the original definition of `getPost`​:

```typescript
const UserClient = {
  getPost: (key: string, id: string) => {
    return sendToApi(`/users/${key}/posts/${id}`)
  }
}
```

It is so easy to call this function incorrectly (especially when dealing with copy-paste or merge conflict issues). For example, this code will compile happily, not alerting you of your mistake:

```typescript
const submit = async () => {
  // Args are in the wrong order! Compiler don't care!
  const res = await UserClient.getPost(
    post.id,
    user.id,
  )

  if (res.type === 'success') {
    // do stuff for succes
  } else {
    // do stuff for failure
  }
}
```

  

With opaque types though, this will blow up:

```typescript
const submit = async () => {
  // Args are in the wrong order! Compiler don't care!
  const res = await UserClient.getPost(
    post.id,
    // => TypeError: Type 'PostId' is not assignable to type 'UserId'
    user.id,
  )

  if (res.type === 'success') {
    // do stuff for succes
  } else {
    // do stuff for failure
  }
}
```

Now, we have compiler checks to make sure our data always comes from the right place! That is pretty sick.

## De-serialization, type guards, and typecasting

So you may be wondering, "_**how do I get one of these types?**",_ which is a perfectly valid question. There are a few answers for this that I can think of.

### 1 - De-serialization

This is where you get the data from a network request and type the response manually. For example, when you get a `User`​ response from the API, the `id`​ field is a `UserId`​. This is great because it means you can track that `UserId`​ as it flows through the application code, comfortable in the knowledge that that underlying string did indeed come from the REST API returning an `User`​.

```typescript
type Result<T> = Success<T> | Err

const UserClient = {
  login: (email: string, password: string): Result<User> => {
    return sendToApi('/login')
  }
}
```

### 2 - Type guards

Sometimes you need to get an opaque type via validation. This is where type guards come in handy. Let's say you have parts of the application code that expect data to already be validated when it is used. A great example of this is a signup function that sends a user email to the API to create an account. We can use an opaque `Email`​ type with a **typeguard** to ensure we **always** validate the email before using.

```typescript
// a very pared-down, contrived example
declare const EmailS: unique symbol
type Email = Opaque<string, EmailS>

const isEmail = (x: string): x is Email => /emailregex/.test(x)

const signup = (email: Email) => {
  return sendToApi('/users/signup', { email })
}
```
  

Now, the only way to get an `Email`​ type is to check that a `string`​ is an email using the `isEmail`​ typeguard function. This is how we would use it to ensure we are only sending valid emails to the API:

```typescript
const unvalidatedEmail = 'some user input string'
signup(unvalidatedEmail)
// => TypeError: Type 'string' is not assignable to type 'Email'

if (isEmail(unvalidatedEmail) {
  signup(unvalidatedEmail)
  // => works great :)
}
```

### 3 - Typecasting

This is the last resort and should really only be done when you have no other choice. For example, maybe the type definitions for a library suck so you need to work around them. In this case, you get an opaque type by typecasting:

```tsx
// some react component
interface Props {
  Posts: Post[]
}

const MyComponent = ({ posts }: Props) => {
  const handleSelect = (key: PostId) => {
    PostClient.getPost(key)
    // do other stuff
  }

  return (
    <SomeLibraryComponent
      collection={posts}
      onSelect={(key) => handleSelect(key as unknown as PostId)}
    />
  )
}
```
  
## That's it!

Thanks for reading!