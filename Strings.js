/**
 * JSSimpleStrings
 * @author Eli Delventhal
 * UnitySimpleStrings converted to JS August 18, 2017
 * Converted to a functional stateless factory approach on Feb 6, 2021
 *
 * Simple but powerful interface for localizing strings in JavaScript. Also
 * useful for general strings management, even if not localizing.
 * Provide any number of json strings objects to the factory function.
 * All subsequent calls (like getString()) will search in the first json object
 * provided for the key, then the next, and so on until the string is found.
 * You can have whatever structure to your strings you want,
 * where you use a "/" to go to sub-objects or array elements.
 *
 * ex:
 * const enJson = require('en.json');
 * const esJson = require('es.json');
 * const { getString } = require('simple-strings')([esJson, enJson]);
 * console.log(getString('my/string/key));
 *
 * See the test file for more examples.
 */

// factory function to initialize, takes either an array of strings JSONs
// or a single strings JSON. Returns an object with several functions that
// will use those jsons.
module.exports = (stringsJsons) => {
  // an array of strings tables, they are read in order until a string key is found
  const languageTables = Array.isArray(stringsJsons) ? stringsJsons : [stringsJsons || {}];
  const remainingArrayIndices = {};

  const getSubstitutedString = (str, substitutions) => {
    if (!substitutions
      || (Array.isArray(substitutions) && substitutions.length <= 0)) {
      return str;
    }

    // javascript regex magic that swaps out the substitutions properly
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (
      substitutions[key] !== undefined
        ? substitutions[key]
        : `ERROR-NO-SUB-${key}`
    ));
  };

  const getRandomElement = (arr) => {
    if (!arr || arr.length <= 0) {
      return undefined;
    }

    return arr[Math.floor(Math.random() * arr.length)];
  };

  const getRandomExcludedElement = (arr, key) => {
    if (!arr || arr.length <= 0) {
      return undefined;
    }

    // create the list for this key if it does not yet exist
    if (!remainingArrayIndices[key]) {
      remainingArrayIndices[key] = [];
    }

    // if the list is out of options, populate it
    if (remainingArrayIndices[key].length <= 0) {
      for (let index = 0; index < arr.length; index += 1) {
        remainingArrayIndices[key].push(index);
      }
    }

    // return a random element from the list, and remove that from the list
    const randIndex = Math.floor(Math.random() * remainingArrayIndices[key].length);
    const arrIndex = remainingArrayIndices[key][randIndex];
    remainingArrayIndices[key].splice(randIndex, 1);
    return arr[arrIndex];
  };

  const getBoundedElement = (arr, arrKey) => {
    if (!arr || arr.length <= 0) {
      return undefined;
    }

    let key = arrKey;
    if (key < 0) {
      key = 0;
    } else if (key >= arr.length) {
      key = arr.length - 1;
    }
    return arr[key];
  };

  const getElement = (arr, key) => arr[key];

  const getArrayValue = (arr, keyPart, parentKey) => {
    if (keyPart === '?') {
      return getRandomElement(arr);
    }
    if (keyPart === '!') {
      return getRandomExcludedElement(arr, parentKey);
    }
    if (keyPart.charAt(0) === 'b') {
      return getBoundedElement(arr, keyPart.substring(1));
    }
    return getElement(arr, keyPart);
  };

  const getValueForKey = (key, useLanguageTableIndex, returnNullOnError) => {
    const languageTableIndex = useLanguageTableIndex || 0;

    // the string couldn't be found
    if (languageTableIndex >= languageTables.length || !(typeof key === 'string')) {
      return returnNullOnError ? null : `ERROR-MISSING-STRING: "${key}"`;
    }

    const languageTable = languageTables[languageTableIndex];
    const keyParts = key.split('/');
    let parentKey = '';
    let val = languageTable;
    for (const keyPart of keyParts) {
      if (Array.isArray(val)) {
        val = getArrayValue(val, keyPart, parentKey);
      } else if (typeof val === 'object') {
        val = val[keyPart];
      } else {
        val = undefined;
      }

      parentKey += keyPart;

      if (val === undefined) {
        // Fall back to the next language option if we couldn't find the key in this language table
        return getValueForKey(key, languageTableIndex + 1, returnNullOnError);
      }
    }

    return val;
  };

  // Returns a localized string using the passed key and any substitutions.
  // See comments at the top for details.
  // You can pass in any number of extra parameters and this function will handle them.
  const getString = (key, ...substitutions) => {
    let val = getValueForKey(key);
    if (val === undefined) {
      return `ERROR-MISSING-STRING: "${key}"`;
    }

    if (typeof val !== 'string') {
      if (typeof val.name === 'string') {
        val = val.name;
      } else {
        return `BAD-TYPE: "${key}"`;
      }
    }

    return getSubstitutedString(val, substitutions.length === 1
      && (substitutions[0] instanceof Array || substitutions[0] instanceof Object)
      ? substitutions[0]
      : substitutions);
  };

  // returns the number of elements in an array key
  const getStringCount = (key) => {
    const val = getValueForKey(key);
    if (val === undefined || !(Array.isArray(val))) {
      return -1;
    }

    return val.length;
  };

  const hasString = key => (key ? Boolean(getValueForKey(key, undefined, true)) : false);

  const capitalize = (str) => {
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.substring(1);
  };

  const capitalizeFirstOnly = (str) => {
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  };

  const physicalId = (str) => {
    if (!str) {
      return str;
    }
    return `{${str.toUpperCase().replace(/_/g, ' ')}}`;
  };

  const findAllStringKeys = (parentKey = null) => {
    let keys = [];
    for (let tableIndex = 0; tableIndex < languageTables.length; tableIndex += 1) {
      const parentObj = parentKey
        ? getValueForKey(parentKey, tableIndex)
        : languageTables[tableIndex];
      if (Array.isArray(parentObj)) {
        keys = keys.concat(parentObj);
      } else if (typeof parentObj === 'object') {
        keys = keys.concat(Object.keys(parentObj));
      } else if (parentObj) {
        keys.push(parentKey);
      }
    }

    // remove dupes
    return [...new Set(keys)];
  };

  return {
    getString,
    getStringCount,
    hasString,
    capitalize,
    capitalizeFirstOnly,
    physicalId,
    findAllStringKeys,
  };
};
