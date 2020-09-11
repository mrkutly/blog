---
title: "Roll your own error handling middleware for redux"
date: "2020/09/10"
author: "Mark Sauer-Utley"
blurb: "Error handling in JS is one of my least favorite things. This pattern makes it okay I think."
---

![Redux logo](/images/redux.png)

I'm going to keep this one short and relatively to the point because I just finished my workday
and am quite tired. I'm working on a project at work that is quite state-heavy. It is essentially an
in-browser IDE and it allows us to stage and deploy code changes onto publishers' websites very quickly.

If I had known more about state machines when I started building the project, I probably would have built it
with XState or something like that. But I did not! So I am using Redux for state management and Thunk middleware
for asynchronous actions.

---

## Error-handling

When I build apps, I try to set up a consistent and centralized way of handling errors ASAP. Writing a billion `try-catch` blocks
all over the place kind of sucks and it is really easy to miss things. It also makes it difficult to gain meaningful insights from
your errors when they are all implemented in an ad-hoc fashion.

I generally try to set myself up so that I am only writing the "happy path" logic in my functions and errors are handled all by one
wrapper function or piece of middleware. This is an approach that I find makes me much happier :)

---

## The setup

Because I am using `thunk`, I pull all of my data-fetching logic out of my components and put it in async actions. An action to
fetch a dog from an API might look like this:

```javascript
const dogStarted = () => ({ type: "DOG_FETCH_STARTED" });
const dogSuccess = dog => ({ type: "DOG_FETCH_SUCCESS", payload: dog });
const dogFailure = error => ({ type: "DOG_FETCH_FALURE", payload: error });

const fetchDog = () => async dispatch => {
  try {
    dispatch(dogStarted());
    const res = await fetch("https://dogapi.com");
    const dog = await res.json();
    if (!dog) throw new Error("Dog fetch failed");
    dispatch(dogSuccess(dog));
  } catch (error) {
    dispatch(dogFailure(error));
  }
};
```

> Note that I would not hardcode action types as strings. Normally, I would save those strings as constants
> to be used throughout the application. This is just done here for clarity.

The reducer would probably look something like this:

```javascript
// @redux/reducers/dog.js
export const initialDogState = {
  data: null,
  status: "idle",
};

function dogReducer(state = initialDogState, action) {
  switch (action.type) {
    case "DOG_FETCH_STARTED":
      return {
        ...state,
        status: "loading",
      };

    case "DOG_FETCH_SUCCESS":
      return {
        ...state,
        status: "idle",
        data: action.payload,
      };

    case "DOG_FETCH_FAILURE":
      return {
        ...state,
        status: "rejected",
        data: action.payload,
      };

    default:
      return state;
  }
}

export default dogReducer;
```

---

## Custom errors

This is all fine, but when you start writing a lot of async actions, you end up with a lot of repeated `try-catch` logic.
Anytime you are rewriting the same logic over and over, you are increasing the surface area for bugs, which is no good.
So I decided in my project to write some custom error classes and hook them up to some redux middleware. By using these
custom errors, I can reference their messages in my tests and even set up reporting for specific errors that get thrown.

For our example, let's create a custom dog error:

```javascript
// in utils/errors.js
const Errors = {
  DogError: class DogError extends Error {
    static message = "Failed to RETRIEVE a dog. Get it?";

    constructor() {
      super(DogError.message);
    }
  },
};
export default Errors;
```

Now, we have this handy error we can use in our tests and in our application code. Let's tell our async action to use it:

```javascript
import Errors from 'utils/errors';

...

const fetchDog = () => async dispatch => {
  try {
    dispatch(dogStarted());
    const res = await fetch("https://dogapi.com");
    const dog = await res.json();
    if (!dog) throw new Errors.DogError();
    dispatch(dogSuccess(dog));
  } catch (error) {
    dispatch(dogFailure(error));
  }
};
```

---

## Handling generic errors

So this is great, but what if we end up with a network failure error on our `fetch` call? Well, we won't get our dog error. Our dog
error only gets thrown when the `fetch` is successful but doesn't have any data attached to it. For this, we need to create a generic
error we can show. Let's do that:

```javascript
// in utils/errors.js
const Errors = {
  DogError: class DogError extends Error {
    ...
  },
  GenericError: class GenericError extends Error {
    static message = "Something unexpected happened... Check your internet connection and try again.";

    constructor() {
      super(GenericError.message);
    }
  }
};

export default Errors;
```

Great! Now let's write a quick function that takes in an error, checks to see if it is one of our user-friendly errors, and if not,
returns the generic error.

```javascript
// in utils/errors.js
const Errors = {
  ...
};

export const getUserFriendlyError = (error) => {
  if (Object.values(Errors).some((errorClass) => error instanceof errorClass)) {
    return error;
  }

  return new Errors.GenericError();
}
export default Errors;
```

So basically, any error that gets passed to this function will be returned **only if it is one of our user-friendly custom errors**. Otherwise,
we'll just return a generic error message to keep them from getting unhelpful messages like "Failed to fetch", or even worse, a
_java stacktrace_ 🤮🤮🤮

So let's wire that up to our async action.

```javascript
import Errors, { getUserFriendlyError } from 'utils/errors';

...

const fetchDog = () => async dispatch => {
  try {
    dispatch(dogStarted());
    const res = await fetch("https://dogapi.com");
    const dog = await res.json();
    if (!dog) throw new Errors.DogError();
    dispatch(dogSuccess(dog));
  } catch (error) {
    dispatch(dogFailure(getUserFriendlyError(error)));
  }
};
```

Okay this is cool but like damn I don't want to have to write those nested functions for EVERY async action in my app.
So let's put this logic into some middleware.

---

## Redux Middleware

Custom redux middleware always looks like this:

```javascript
const myMiddleware = (store) => (next) => (action) {
  // do something
  return next(action);
};
```

We could describe this as a function that takes in a redux store and returns a function that takes in a function called "next" and returns
a function that takes in an action and calls next with the action.

But let's not describe it like that. Let's just say this is the curried form of this function:

```javascript
const myMiddleware = (action, next, store) => {
  return next(action);
};
```

If you are not familiar with **currying**, it is a concept from functional programming where you write a function that takes in its
arguments one at a time. Sounds fancy, looks intimidating (so many arrows!), but don't let it freak you out.

So in our middleware, we have access to the redux store, the current action being dispatched, and a function called `next` that allows
us to continue the middleware chain whenever we like.

For example, this is what the entirety of the `redux-thunk` library consists of:

```javascript
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === "function") {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

Not too bad, right? So let's write our own.

---

## Our custom middleware

Our middleware is going to expect our async actions to have three things:

1. a type of `"ASYNC"`
2. a `handler` which is an async function
3. an `errorType` key which is an action type for our error action

Let's make a function that will apply the type for us (since it is always the same):

```javascript
// @redux/types/asyncAction.js
const AsyncAction = ({ handler, errorType }) => {
  type: "ASYNC",
  handler,
  errorType,
}

export default AsyncAction;
```

Now we are going to create a middleware that:

1. checks to see if our action has the type `"ASYNC"`
2. if so, it will apply the error handling
3. if not, it will return `next(action)` (the default behavior of redux)

We'll also create an error action type called `ErrorAction` that is similar to the `AsyncAction`:

```javascript
// @redux/middleware/handleErrors.js
import { getUserFriendlyError } from "utils/errors";

const ErrorAction = type => error => ({
  type,
  payload: error,
});

const handleErrors = ({ dispatch, getState }) => next => action => {
  if (action.type === "ASYNC") {
    const errorAction = ErrorAction(action.errorType);
    return action
      .handler(dispatch, getState)
      .catch(e => dispatch(errorAction(getUserFriendlyError(e))));
  }

  return next(action);
};
```

To get this plugged in, let's apply this middleware wherever we create our store:

```javascript
// @redux/store.js
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import handleErrors from "@redux/middleware/handleErrors";
import dogReducer, { initialDogState } from "@redux/reducers/dog";

const store = createStore(
  dogReducer,
  initialDogState,
  applyMiddleware(handleErrors, thunk)
);

export default store;
```

So now, anytime we dispatch an action with the `ASYNC` type, its `handler` gets called and its errors our caught and cleaned up for us.
Now lets refactor our original async action to fit our new structure.

```javascript
import AsyncAction from "@redux/types/asyncAction";

const dogStarted = () => ({ type: "DOG_FETCH_STARTED" });
const dogSuccess = dog => ({ type: "DOG_FETCH_SUCCESS", payload: dog });

const fetchDog = () =>
  AsyncAction({
    errorType: "DOG_FETCH_FAILURE",
    handler: async dispatch => {
      dispatch(dogStarted());
      const res = await fetch("https://dogapi.com");
      const dog = await res.json();
      if (!dog) throw new Errors.DogError();
      dispatch(dogSuccess(dog));
    },
  });
```

Great! Now we can just write the "happy path" and rest easy knowing our users our going to get readable errors thanks to our
middleware.

---

## That's it

This might be an awful way of doing this. I am not smart enough to know. But, I'm doing it and it is working for
me so far. So I hope you enjoyed reading this bbs. Bama mine wabmenem <3
