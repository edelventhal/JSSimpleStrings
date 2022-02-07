# js-simple-strings

A simple but powerful interface for localizing strings in JavaScript. Also
useful for general strings management, even if not localizing.
Provide any number of json strings objects to the factory function.
All subsequent calls (like `getString()`) will search in the first json object
provided for the key, then the next, and so on until the string is found.
Any organizational structure to the json objects is allowed;
a "/" in the key is used to retrieve sub-objects or array elements.

## Installation

Using npm:
```shell
$ npm i js-simple-strings
```
Note: add `--save` if you are using npm < 5.0.0

In Node.js:
```js
// example:
const enJson = require('en.json');
const esJson = require('es.json');
const { getString } = require('js-simple-strings')([esJson, enJson]);
console.log(getString('my/string/key'));
```

## Usage

js-simple-strings works with a factory function for language initialization,
and so any number of languages can be loaded simultaneously using different
factory functions.

```js
const enStrings = require('js-simple-strings')(enJson);
const esStrings = require('js-simple-strings')(esJson);
```

Multiple strings jsons can be provided to allow for fallbacks. For example,
there may be a default language of English and a preferred Spanish file that is
not fully translated. In the example below, as long as a key exists in the
`esJson` file, it would be used, and if not, the `enJson` file will be used.

```js
const strings = require('js-simple-strings')([esJson, enJson]);
```

Several functions are exported and can be used.

### getString

Takes a string key that points to a value within a passed json file. Slashes
are used to denote sub-objects or sub-arrays.

```js
const strings = require('js-simple-strings')({
  "my": {
    "key": "Hello, World!"
  }
});

console.log(strings.getString('my/key'));
// prints "Hello, World!"
```

Can take a second parameter to provide substitutions for double handlebars.

```js
const strings = require('js-simple-strings')({
  "substitution": "Fill in {{this}} or {{that}}"
});

console.log(strings.getString('substitution', {
  this: 'something',
  that: 'another',
}));
// prints "Fill in something or another"
```

Substitutions can also be provided via array indices.

```js
const strings = require('js-simple-strings')({
  "substitution": "First {{0}} Second {{1}} Third {{2}}"
});

console.log(strings.getString('substitution', ['hi', 'there', 'man']));
// prints "First hi Second there Third man"
```

Members of an array in the json can be accessed via indices.

```js
const strings = require('js-simple-strings')({
  "array": [
    "First",
    "Second",
    "Third"
  ]
});

console.log(strings.getString('array/0'));
// prints "First"

console.log(strings.getString('array/1'));
// prints "Second"

console.log(strings.getString('array/2'));
// prints "Third"
```

Members of a json array can be accessed randomly for convenience using the '?'
character.

```js
const strings = require('js-simple-strings')({
  "array": [
    "First",
    "Second",
    "Third"
  ]
});

console.log(strings.getString('array/?'));
// randomly prints "First", "Second", or "Third"

console.log(strings.getString('array/?'));
// randomly prints "First", "Second", or "Third"

console.log(strings.getString('array/?'));
// randomly prints "First", "Second", or "Third"
```

Using the '!' character instead allows distributed randomness – members of a
json array will be accessed randomly, but an even distribution is forced.

```js
const strings = require('js-simple-strings')({
  "array": [
    "First",
    "Second",
    "Third"
  ]
});

console.log(strings.getString('array/!'));
// randomly prints "First", "Second", or "Third"

console.log(strings.getString('array/!'));
// randomly prints "First", "Second", or "Third", but not what was printed the
// first time

console.log(strings.getString('array/!'));
// randomly prints "First", "Second", or "Third", whichever wasn't already
// printed
```

Members of an array in the json can be accessed via bounded indices by
preceeding the index with a 'b' character. The index that follows will be
clamped within the bounds of the json array.

```js
const strings = require('js-simple-strings')({
  "array": [
    "First",
    "Second",
    "Third"
  ]
});

console.log(strings.getString('array/b-1'));
// prints "First"

console.log(strings.getString('array/b0'));
// prints "First"

console.log(strings.getString('array/b5'));
// prints "Third"
```

An object type can be given a `name` that will return if the object's key is
referenced directly.

```js
const strings = require('js-simple-strings')({
  "object": {
    "name": "My Object",
  }
});

console.log(strings.getString('object'));
// prints "My Object"

console.log(strings.getString('object/name'));
// prints "My Object"
```

Various errors can be returned. 
`ERROR-MISSING-STRING: "my/key"` is returned if a key cannot be found.
`ERROR-NO-SUB-my/key` is returned if an expected substitution has no key given.
`BAD-TYPE: "my/key"` is returned if a key leads directly to an object without a
`name` or an array.

### getStringCount

Returns the number of elements underneath a json array or object. If the
key does not exist, -1 is returned. Otherwise, 1 is returned.

```js
const strings = require('js-simple-strings')({
  "array": [
    "First",
    "Second",
    "Third"
  ],
  "object": {
    "a": "hello",
    "b": "world"
  },
  "key": "Here we are."
});

console.log(strings.getStringCount('array'));
// prints 3

console.log(strings.getStringCount('object'));
// prints 2

console.log(strings.getStringCount('key'));
// prints 1

console.log(strings.getStringCount('unknown'));
// prints -1
```

### hasString

Returns true if a string of the passed key exists, false otherwise.

```js
const strings = require('js-simple-strings')({
  "my": {
    "key": "Hello, World!"
  }
});

console.log(strings.hasString('my/key'));
// prints true

console.log(strings.hasString('your/key'));
// prints false
```

### capitalize

Capitalizes the first character of the passed string.

```js
const strings = require('js-simple-strings')({
  "my": {
    "key": "hello, world!"
  }
});

console.log(strings.capitalize('hello there'));
// prints "Hello there"

console.log(strings.capitalize(strings.getString('my/key')));
// prints "Hello, world!"
```

### capitalizeFirstOnly

Capitalizes the first character of the passed string and lowercases the rest.

```js
const strings = require('js-simple-strings')({
  "my": {
    "key": "hello, WORLD!"
  }
});

console.log(strings.capitalizeFirstOnly('hello THERE'));
// prints "Hello there"

console.log(strings.capitalizeFirstOnly(strings.getString('my/key')));
// prints "Hello, world!"
```

### findAllStringKeys

Returns all keys in all strings jsons that were passed into the factory
function. Can take an optional parent key and only return keys underneath
that parent.

```js
const strings = require('js-simple-strings')({
  "my": {
    "key": "Hello, World!",
    "door": "It's locked."
  },
  "array": [
    "First",
    "Second",
    "Third"
  ]
});

console.log(strings.findAllStringKeys());
// prints ['my/key', 'my/door', 'array/0', 'array/1', 'array/2']

console.log(strings.findAllStringKeys('my'));
// prints ['my/key', 'my/door']
```

## Why js-simple-strings?

It's super simple and small (with zero dependencies) and does what you need
and nothing else. It makes no assumptions about where json files are coming
from or how they're formatted, allowing you to make giant CSV-style strings or
complex organizations of nested strings.

As long as you provide the jsons in priority order, you can easily support
many different languages and locales. A common use case is to put the user's
desired language first and fallback languages (like English) afterwards. In
that case, if the key exists in their language, it will be used, and otherwise
they will at least see your fallback.

Locales are easily supported in this way by providing locales (say en-gb)
with only the necessary changes ("tyre" instead of "tire") and then the default
locale (like en-us) as the fallback.
