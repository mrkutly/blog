---
title: "Setting Up Authenticated Sessions with Svelte and Sapper (Sapper can have little an auth, as a treat)."
date: "2020/02/29"
author: "Mark Sauer-Utley"
blurb: "How to setup a session store and use JWT's to keep track of user authentication in my new favorite framework."
---

![Sapper logo](./images/sapper-logo.jpg)

I recently picked up Svelte after watching [this great talk](https://www.youtube.com/watch?v=AdNJ3fydeao) 
from Rich Harris about rethinking how we build frontend Javascript frameworks. If 
you have half an hour to kill and haven't seen it, check it out. I promise it is better than 
any content you will find on my blog.

But if you are still here! I want to talk about dealing with authentication in Svelte and Sapper. 
If you are unfamiliar with Sapper, it is to Svelte what Next.js is to React. If you are 
unfamiliar with Next.js, it is a framework for building server-rendered React apps that give you 
out-of-the-box routing, code-splitting, server-rendering, and a whole host of other goodies.

Sapper is relatively new compared to Next.js, which makes it exciting (yay new!) but also scary 
(there aren't a billion medium.com articles about how to do every single thing in it). Because of 
this, I recently had trouble getting authenticated sessions setup due to being unfamiliar with the 
framework. So, I wanted to write about it because there weren't many good examples online.

---

## The Setup 

I have a REST API that uses JWT for user authentication. For this example, we'll say that 
a user can login and save and view details about their favorite dogs. 

If this were a client-rendered app, I would probably have a flow like this: 
  
  - User enters their login details and clicks login. 
  - Some code executes in the browser to send those details to the REST API.
  - The REST API sends the token back to the browser.
  - That token is stored in the app state for future requests and maybe thrown into `localStorage` for future visits to the site.
  - The client app uses that token to fetch the doggie details and render the doggie details page.

There's probably some Svelte component handling the login that looks like this: 

```html
<script>
  import { authToken } from '../stores';
  
  let password = '';
  let email = '';
  let error;

  const handleLogin = async () => {
    const response = await fetch('https://www.myapi.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const parsed = await response.json();
    
    if (parsed.token) {
      $authToken = parsed.token;
    } else {
      error = parsed.error;
    }
  }
</script>

<form on:submit|preventDefault={handleLogin} method="post">
  <label>
    Email:
    <input type="email" bind:value={email}>
  </label>
  <label>
    Password:
    <input type="password" bind:value={password}>
  </label>
  <button type="submit">Login</button>
</form>

{#if error} 
  <p>{error}</p>
{/if}
```

And this all works great if I am running a client-rendered app. But I want all 
the nice benefits of a server-rendered framework like Sapper, so this won't work.

---

## Why won't it work?

Well, my app is *server-rendered*, so the server also needs to know about the `authToken`. 
This way, when a user tries to go to see their favorite dogs, the server can send 
the `authToken` to the REST API to get all the dog details for that logged-in user. Then, it can 
generate the HTML, CSS, and JS bundle necessary to render those details, and ship them to the client.

If the token is only stored in the client's app-state, then the **client** would need to make that REST 
API request to get the dog details, which means the **client** will then be in charge of rendering the 
dog details page. And just like that, you have lost all those nice benefits that SSR gives you (routing, 
code-splitting, easy-prefetching, etc.).

This might be obvious for some of you who have more experience with server-rendered apps, but I think 
this is an important thing to breakdown for people with less SSR experience.

---

## What do I do?

Our SSR (server-side rendering) flow will look something like this: 

  - User enters their login details and clicks login. 
  - Some code executes in the browser to send those details to the Sapper server (not the REST API).
  - The Sapper server sends those details to the REST API.
  - The REST API sends the JWT to the Sapper server.
  - That token is then added to that user's `session` in some kind of session store for future requests **and** for future visits to the site.
  - The user can then navigate to the doggie details page.
  - The Sapper server uses the token stored in that user's `session` to fetch the doggie details and generate the HTML, CSS, and JS to send to the client.

Let's break this down into implementation steps:

  1. First, we need to implement a session store to keep track of user sessions for us.
  2. Then we need a piece of middleware on our Sapper server that attaches the session data to each request.
  3. Next, we need to setup a Sapper server route to:
    - send login details to the REST API
    - save the token to the user session 
    - tell the client that everything went okay
  4. We will then need to update the client's local session store to make sure it is synced with the server session store.
  5. Last, we will implement an SSR doggie details page that fetches the details with the token stored in the session.

---

## Step 0 - Have a Sapper project 

For this post, I'm going to be referencing a project that was bootstrapped according to the Sapper docs.

If you wanna follow along with a fresh project, run this in your terminal:

`$ npx degit "sveltejs/sapper-template#rollup" my-app`

---

## Step 1 - Setup a Session Store 

A session store is essentially a cache. It's just a special kind of cache that is going to map cookies to records 
and then use those records to store data about the user. Because of this, there are a couple of cache implemetations
you can use. I normally like using Redis, but I'm just going to use a filesystem cache here 
because it has almost zero setup involed.

We need to install three packages into our Sapper project

  1. [body-parser](https://www.npmjs.com/package/body-parser) - we're just going to use this for parsing json between requests. I'm using the Sapper 
  template that is setup with polka (not express) so I am going to need this.
  2. [express-session](https://github.com/expressjs/session) - this is a nice piece of express middleware that handles our sessions for us. It's going to 
  handle creating cookies to track specific users, mapping those cookies to records in the store (cache), and attaching those 
  sessions to the requests for the rest of the routes to reference. (It's okay, we can use express middlewares with polka!)
  3. [session-file-store](https://www.npmjs.com/package/session-file-store) - this is going to be the thing that handles storing our session data and removing expired sessions.

Let's run this in our terminal:

`$ npm i session-file-store express-session body-parser`

Now that they are installed, let's implement them. 
In our project we, have a `src/server.js` file that looks like this:

```javascript 
// in src/server.js

import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka() // You can also use Express
	.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
```

Let's import our lovely fresh packages into this file and instantiate our filestore:

```Javascript
// in src/server.js

import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import { json } from 'body-parser';
import session from 'express-session';
import sessionFileStore from 'session-file-store';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const FileStore = new sessionFileStore(session);

polka() // You can also use Express
	.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
```

There it is, there's the store! On to step two.

---

## Step 2 - Session Middleware

Now we are going to go ahead and tell our server to use the `json` middleware we grabbed from 
`body-parser`. We're also going to tell it use the `session` middleware from `express-session`.
This is what is going to create our sessions and attach the cookies for session-tracking to each request
that comes in.

```javascript 
// in src/server.js

...
polka() // You can also use Express
  .use(
    json(),
    session({
      secret: 'SomeSecretStringThatIsNotInGithub',
      resave: true,
      saveUninitialized: true,
      cookie: {
        maxAge: 31536000
      },
      store: new FileStore({
        path: `.sessions`
      })
    }),
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    sapper.middleware()
  )
  .listen(PORT, err => {
    if (err) console.log('error', err);
  });
```

Now, if you start up the server by running `$ npm run dev` and go to [http://localhost:3000](http://localhost:3000) in your 
browser to make sure it works. Once you have visited the page, look back in your project directory
for the `.sessions` folder. You should have a json file in there with your session data. Cool, right?

The next thing we have to do is tell Sapper to attach session data to all of the requests that it sends back 
and forth with the browser. This is going to be important for getting our doggie details later:

```javascript
// in src/server.js

...
polka() // You can also use Express
  .use(
    json(),
    session({
      ...
    }),
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    sapper.middleware({
      session: (req, res) => {
        return ({
          token: req.session.token
        })}
      })
    )
  .listen(PORT, err => {
    if (err) console.log('error', err);
  });
```

---

## Step 3 - Login Server Route

Server routes in Sapper are pretty easy to setup. If you create a file in the `routes` directory and 
give it a `.js` extension instead of a `.svelte` extension, then it becomes a server route. Server route 
files work by exporting functions that map to HTTP methods.

So if you want to have a route that handles `POST` requests to `/login`, you would make a file in the 
`src/routes` folder called `login.js` that exports a function called `post`:

```javascript 
// in src/routes/login.js

export async function post(req, res) {
  res.end('thanks for loggin in');
}
```

Awesome! Let's refactor that login component from earlier. This time, instead of hitting the REST API 
login route, it will hit our Sapper login server-route.

```html
<!-- in src/routes/login.svelte -->

<script>
  let password = "";
  let email = "";
  let error;

  const handleLogin = async () => {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });
  };
</script>

<form on:submit|preventDefault={handleLogin} method="post">
  <label>
    Email:
    <input type="email" bind:value={email} />
  </label>
  <label>
    Password:
    <input type="password" bind:value={password} />
  </label>
  <button type="submit">Login</button>
</form>

{#if error}
  <p>{error}</p>
{/if}
```

Awesome! If try to use this form now, it won't work because we will just hit our `login.svelte` route,
which just spits out HTML. We need to implement the server route that sends the data to our REST API now.

First though, we should install something like `isomorphic-unfetch` or `node-fetch` so we can make 
promise-based http requests. Remember, **this code is executed on our server where there is no fetch API**.

Let's install `node-fetch` by running `$ npm i node-fetch` in my terminal.

Then, we'll open up `src/routes/login.js` and start implementing our login route.

```javascript
// in src/routes/login.js
import fetch from 'node-fetch';

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

export async function post(req, res) {
  try {
    const { email, password } = req.body;
    
    const result = await fetch(`https://www.myapi.com/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    })
    
    const parsed = await result.json();

    if (typeof parsed.error !== 'undefined') {
      throw new Error(parsed.error);
    }
    
    req.session.token = parsed.token;
    res.end(JSON.stringify({ token: parsed.token }));
  } catch (error) {
    res.end(JSON.stringify({ error: error.message }));
  }
}
```

In this function, we are getting token from the server, attaching it to the session, and sending it back 
to the client. If there is an error, we will just send the error message back to the client. 

---

## Step 4 - Sync Client Session with Server Session 

Let's flip back over to our login component and handle these responses now. We're going to to use 
the `stores` function that is exported from `@sapper/app` to grab our client-side session record and 
update it with the token that we got back from the server. We'll also redirect the client to the doggie-details 
page once they are logged in.

```html 
<!-- in src/routes/login.svelte -->

<script>
  import { goto, stores } from "@sapper/app";
  const { session } = stores();

  let password = "";
  let email = "";
  let error;

  const handleLogin = async () => {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const parsed = await response.json();

    if (parsed.error) {
      error = parsed.error;
    } else {
      $session.token = parsed.token;
      goto("/doggie-details");
    }
  };
</script>

<form on:submit|preventDefault={handleLogin} method="post">
...
```

Our client and server session data will now be in sync and we are ready to use those tokens 
to fetch the doggie details.

---

## Step 5 - Fetch the Doggie Details on the Server with the Session Token 

To tell our pages what data to prefetch, we can export a `preload` function from them. This 
function is similar to `getInitialProps` in Next.js if you are familiar with that.

This function should be defined in the module context and will be run *before* the component is 
sent to the client. Check out the [Sapper Docs here](https://sapper.svelte.dev/docs#Preloading) for reference. 
The `preload` function gets two arguments, the `page` and the `session`. The `page` argument has a lot 
of useful stuff like the path (for dynamic routing) or query params for more complex routes. But for us,
we are going to be primarily concerned with the `session` param that gets passed. I wonder what it has in it...

Let's throw a `preload` function in our `src/routes/doggie-details.svelte` file and `console.log` the 
session to see what we're working with.

```html 
<!-- in src/routes/doggie-details.svelte -->

<script context="module">
  export function preload(page, session) {
    console.log(session);
  }
</script>

<h1>welcome to the doggie details page</h1>
```

Wonder what got popped into the console... Let's check in our terminal.

```javascript 
{
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTU4Mjk0NzAxO...'
}
```

Nice! Let's use that token to get our user's doggies. If you read the 
[Sapper Docs about preloading](https://sapper.svelte.dev/docs#Preloading), you might have seen 
that within the `preload` function, we have access to a method called `this.fetch`, so even though 
this bit of code is getting run on the server, we don't have to import `node-fetch` to make 
promise-based HTTP requests.

Our `preload` function is going to: 
  1. Get the token out of the session.
  2. If there is no token, we'll redirect the user to the login.
  3. If we get an error from the server, we'll send the user to an error page. 
  4. If there are doggies and the user was authenticated and everything worked fine, we'll pass the doggies to our component for rendering.

```html 
<!-- in src/routes/doggie-details.svelte -->

<script context="module">
  export async function preload(page, session) {
    const { token } = session;

    if (!token) {
      return this.redirect(302, "login");
    }

    const response = await this.fetch(`https://www.myapi.com/doggies`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
      }
    });

    const parsed = await response.json();

    if (parsed.error) {
      return this.error(response.status, parsed.error);
    }

    return { doggies: parsed.doggies };
  }
</script>

<h1>welcome to the doggie details page</h1>
```

> **_Note that the return value of the preload function when everything works is an object containing 
> all the props that will be passed to the component._**

Now, we can add a little client side script to declare that our component is going to get a prop 
called `doggies`. Once we have done that, we can render them out in our component. 
Nothing special going on here, this is just normal Svelte props :)

```html 
<!-- in src/routes/doggie-details.svelte -->

<script context="module">
  export async function preload(page, session) {
    ...
    return { doggies: parsed.doggies };
  }
</script>

<script>
  export let doggies = [];
</script>

<h1>welcome to the doggie details page</h1>
<ul>
  {#each doggies as doggo}
    <li>{doggo.name} - {doggo.breed}</li>
  {/each}
</ul>
```

And that's it! We could talk about auth and sessions all day probably, but this is just 
to get you up and running with sessions in your Sapper app.

--- 

## Thanks :)

Thanks for reading! Migwech n'nikanek <3
