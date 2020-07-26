---
title: "How Languages Shape Our Thinking"
date: "2020/07/26"
author: "Mark Sauer-Utley"
blurb: "How learning new languages forces us to think in different ways."
---

![Strawberries on the vine](/images/strawberry.jpg)

These last few months, I've been learning two languages that are new to me. The first is Elixir,
the functional language built on top of the Erlang virtual machine (BEAM). The second is Bodéwadmimwen,
the Native language of my tribe, the Potawatomi.

For those of you unfamiliar with the history (as it is not taught in US or Canadian schools),
Native American peoples were (and still are) violently forced to assimilate into Euroamerican culture.
This was done through many means, the most common practice being through kidnapping Native children and sending them
to [boarding schools](https://en.wikipedia.org/wiki/American_Indian_boarding_schools) where they were violently punished
for speaking their languages, using their real names, or doing anything else "Indian". The last of these schools was closed
in 1973, but Native communities still live with the repercussions. As a result, many of our languages have died out or are still dying.

I'm not writing all this to share doom and gloom about the history of the Euroamerican treatment of Native peoples. Usually
talking about this history just invites racists to say shit like "well if it weren't for **my** ancestors, you would still be
living in a tipi and wearing a loincloth!" (Potawatomi people did not do either of those things). It is just that
it is important context for what I want to talk about, and that is how languages shape our worldview, and how programming languages
shape how we think about software.

## Animacy and Inanimacy

Potawatomi people did not view the world the way Europeans did. Europeans love the concept of gender. They are obsessed with it.
Spanish and French are languages where all nouns are male or female. German is a language where all nouns are male, female, or neuter.

In Bodéwadmimwen, all nouns are either animate or inanimate. Things are either living or not. English speakers will probably think that
this means all animals and humans are living and everything else is not, but they would be wrong. Potawatomi people have a very different
concept of animacy than Euroamericans. For example, a _migwen_ or eagle feather is inanimate when it is not in use, and animate when it
is being used in a ceremony. Similarly, a _dabyan_ or car is not animate when it is not moving, but animate when it is moving.
Cars in a parking lot would be referred to as _dabyanen_, while cars on a freeway would be _dabyanek_. _Dé'men_ or strawberry, is
animate when it is still attached to its lifesource, and inamiate once it is picked.

Once someone starts to view the world as being full of animate things, it is really difficult for them to fit into American capitalist
society, which is shaped by the Christian view that all things on _Segmekwé_ (or Mother Earth) are here to be ruled and used up by
humans until the end of days. Potawatomi people recognized that we are part of the Earth and that anything bad for the land is also
bad for us. This is why killing our languages was such an important part of the US's campaign for Native assimilation.

## Decolonizing Minds

My language teacher is one of the last 5 people alive who speak Bodéwadmimwen as their first language. He is an 80 year old veteran
who has helped countless _Neshnabé_ people learn their language. He tells me every week that he is trying to "decolonize" my mind.
Every day I learn more and more what he means by that. It is truly impossible for someone to understand Bodéwadmimwen or any Neshnabé
language if they think like a Euroamerican. Our brains have been shaped by the dominant US society since birth. Our understanding of
something as simple as a strawberry is wrong! Unlearning all this garbage can be daunting, but also incredibly fulfilling.

## Okay but like what does this have to do with programming?

Around the same time that I started learning Bodéwadmimwen, I also started learning Elixir. I am primarily a Javascript developer,
though I also have varying degrees of experience with Ruby, Java, Kotlin, and Swift.

Elixir is a _functional_ language, which is an entirely different paradigm than any of the above languages, which are mostly object-oriented.
Javascript _supports_ functional programming, but it by no means enforces it. I would always think I was writing functional JS, but
I was usually mutating data in one form or another. For example, object spreading:

```javascript
const dog = {
  name: "dumptruck",
  breed: "corgi",
};

const margaret = {
  name: "margaret",
  dog,
};

// spreading objects creates a copy right?
const john = {
  name: "john",
  ...margaret,
};

john.dog.name = "peaches";

// no! only the top level keys get copied. Nested stuff is passed as a reference
margaret.dog.name; // => "peaches";
```

What would this look like in elixir?

```elixir
dog = %{name: "dumptruck", breed: "corgi"}
margaret = %{name: "margaret", dog: dog}
jonathan = %{name: "jonathan", dog: dog}
jonathan = Map.update!(jonathan, :dog, fn jonathans_dog ->
	%{jonathans_dog | name: "peaches"}
end)

jonathan.dog.name # => "peaches"
margaret.dog.name # => "dumptruck"
dog.name # => "dumptruck"
```

In elixir, **all** data is immutable, so it is literally impossible to mutate dog, no matter how hard we try. The only way to change
the value of `dog` would be to explicitly reassign the `dog` variable. Notice that this is how we updated `jonathan`, by reassigning
`jonathan` to the result of the `Map.update!` function.

This is a huge shift from javascript, where we are often encouraged to use `const` for everything so we don't "accidentally reassign"
something and "mutate" it (I think this is a silly argument, but I won't go into that). Learning elixir has forced me to change the
way I think about immutability and how to write functional code, and I am so glad I did. I am now way better at recognizing when
I am about to unintentionally mutate something in my JS.

## Mnozheshmowen

The word _mno_ in Bodéwadmimwen means "good". Unlike in English, for something to be truly good, it must benefit all who are affected.
There is no such thing as something that is "good" for one person and "bad" for everyone else, because Neshnabé people recognized
that the wellbeing of the collective is not separate from the wellbeing of the individual.

The word _zheshmowen_ means language. A good language is one that provides the speaker with a worldview that leads to a good life
(_mnobemadzewin_). Everything we do and everything we understand about the world is shaped by the language we speak and think in.
It will be impossible for me to _accidentally_ lead a bad life if I become a fluent Bodéwadmimwen speaker
(I can of course still _intentionally_ lead a bad life, as any other speaker could).

I think a good programming language is one that will encourage its user to write good software. This is definitely true of some languages
more than others (Rust and Elixir immediately come to my mind). I'm not saying Javascript is a bad language. It can be a total joy to work with.
But it can also be a HUGE pain if we aren't really careful about how we write our software. It doesn't hand us a gun to shoot ourselves
in the foot with, but it does leave the gun safe unlocked and the ammo is stored in there with the guns.

## Iw énajmowyan

That's all I have to say for now. Hope you enjoyed reading this :)
