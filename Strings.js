/**
 * JSSimpleStrings
 * @author Eli Delventhal
 * UnitySimpleStrings converted to JS August 18, 2017
 *
 * Simple but powerful interface for localizing strings in JavaScript. Also
 * useful for general strings management, even if not localizing.
 * - In the resources folder, create a "Locale" folder.
 *      Within that, create a folder for each language, use underscores and lowercase. ex "en_us" 
 *      Add a JSON file with your strings in it to your project to each folder, called "strings.json".
 * - Then, simply call Strings.get( "path/to/string" ) to get any string.
 *
 * The proper JSON file will be loaded asynchronusly based upon the locale passed into the app parameters.
 * The default language is "en" and will be used as a fallback.
 * However, you can change the default at any time by changing the 
 * defaultLanguage property to whatever you want. From there, you can have whatever
 * structure to your strings you want, where you use a "/" to go to sub-objects or
 * array elements.
 *
 * ex:
Locale/en-us/strings.json
{
    "intro":
    {
        "hello": "Hello, World!",
        "bye": "Goodbye, {0}! I hope you enjoy seeing {1}!",
        "options":
        {
            "copy": "Copy",
            "paste": "Paste"
        }
    },
    "choices":
    [
        "Choice A",
        "Choice B"
    ],
    "monkey": "melon"
}

Locale/es-mx/strings.json
{
    "monkey": "melón"
}
 *
 * Strings has a lot of simple but powerful functionality on top of basic string
 * lookups, as you can guess from the example above.
 * - To access a string in the root:
 *      Strings.Get( "monkey" ) //if the language is Spanish, returns "melón", otherwise returns "melon"
 * - To access a string underneath an object:
 *      Strings.Get( "intro/hello" ) //Hello, World!
 * - To access a string underneath multiple objects:
 *      Strings.Get( "intro/options/copy" ) //Copy
 * - To substitute values in a returned string:
 *      Strings.Get( "intro/bye", "Eli", "Falcon" ) //Goodbye, Eli! I hope you enjoy seeing Falcon!
 * - To return an array element:
 *      Strings.Get( "choices/0" ) //Choice A
 *      Strings.Get( "choices/1" ) //Choice B
 * - To return an array element that uses a bounded index:
 *      Strings.Get( "choices/b-1" ) //Choice A
 *      Strings.Get( "choices/b0"  ) //Choice A
 *      Strings.Get( "choices/b1"  ) //Choice B
 *      Strings.Get( "choices/b2"  ) //Choice B
 * - To return a random array element:
 *      Strings.Get( "choices/?" ) //Either "Choice A" or "Choice B"
 *      Strings.Get( "choices/?" ) //Either "Choice A" or "Choice B"
 *      Strings.Get( "choices/?" ) //Either "Choice A" or "Choice B"
 * - To return a random array element, enforcing even distribution:
 *      Strings.Get( "choices/!" ) //Either "Choice A" or "Choice B"
 *      Strings.Get( "choices/!" ) //Either "Choice A" or "Choice B", whatever was not returned last time
 *      Strings.Get( "choices/!" ) //Either "Choice A" or "Choice B"
 * - When you mess up:
 *      Strings.Get( "missing/not/there" ) //ERROR: "missing/not/there"
 *      Strings.Get( "intro" ) //BAD TYPE: "intro"
 *      Strings.Get( "anything" ) //UNINTIALIZED: "anything" <--- if you didn't call init()
 */

var Strings = {};

// The file extension is not included, {0} is replaced with the locale
Strings.STRINGS_PATHS = [ "Locale/game/{0}/strings", "Locale/shared/{0}/strings" ];

//an array of strings tables, they are read in order until a string key is found
Strings._languageTables = null;
Strings._remainingArrayIndices = {};

// The language that the user prefers, as set in Init(). this is not guaranteed
// to have a matching table.
Strings.language = "en_us";

Strings.defaultLanguage = "en_us";

Strings.usedLanguage = null;  // Useful for populating the locale_id metadata field.

//block us from being able to initialize multiple times
Strings.isInitializing = false;

Strings.init = function( cb )
{
    if ( this.isInitialized() || this.isInitializing )
    {
        if ( cb )
        {
            cb();
        }

        return;
    }

    console.log( "Strings – Using a language of \"" + this.language + "\" and a default of \"" + this.defaultLanguage + "\"" );

    //used for array distributed random generation (the ! symbol)
    this.remainingArrayIndices = {};

    //loads all the different possible string tables in priority order
    this._loadAllStringsFiles( [ this.language, this.defaultLanguage ], function()
    {
        if ( cb )
        {
            cb();
        }
    });
};

Strings.isInitialized = function()
{
    return this._languageTables !== null;
};
    
// Returns a localized string using the passed key and any substitutions.
// See comments at the top for details.
// You can pass in any number of extra parameters and this function will handle them.
Strings.get = function( key )
{
    if( !this.isInitialized() )
    {
        this.init();
        console.warn( "Strings is not yet initialized and you called Strings.get()! This is asynchronous so you're borked. :'-(" );
        return "UNINITIALIZED: \"" + key + "\"";
    }

    var val = this._getValueForKey( key );
    if( val === undefined )
    {
        return "ERROR: \"" + key + "\"";
    }

    if( typeof( val ) !== "string" )
    {
        return "BAD TYPE: \"" + key + "\""; 
    }
    
    //copy the extra params into an array
    var substitutions = [];
    var paramIndex;
    for( paramIndex = 1; paramIndex < arguments.length; paramIndex++ )
    {
        substitutions.push( arguments[ paramIndex ] );
    }

    return this._getSubstitutedString( val, substitutions );
};

//returns the number of elements in an array key
Strings.getCount = function( key )
{
    if( !this.isInitialized() )
    {
        this.init();
        console.warn( "Strings is not yet initialized and you called Strings.getCount()! This is asynchronous so you're borked. :'-(" );
        return -1;
    }
    
    var val = this._getValueForKey( key );
    if( val === undefined || !( val instanceof Array ) )
    {
        return -1;
    }

    return val.length;
};

Strings._loadAllStringsFiles = function( locales, cb )
{
    if ( this.isInitializing )
    {
        cb();
        return;
    }
    
    this.isInitializing = true;
    
    //create an array of language tables, and wait to copy them to this._languageTables until we've finished loading them all
    var newLanguageTables = [];

    //call this when loading has been completed successfully
    var loadingCompleted = function()
    {
        this._languageTables = newLanguageTables;
        this.isInitializing = false;
        cb();
    }.bind(this);

    //create a list of files that we'll load, in priority order:
    //language, language shared, default, default shared
    var files = [];
    var localeIndex;
    var localePerPath = [];
    for ( localeIndex = 0; localeIndex < locales.length; localeIndex++ )
    {
        var locale = locales[ localeIndex ];

        if ( locale )
        {
            // all locale resource folders are lower_snake_case, which may not match what we're passed from the website
            locale = locale.replace( /-/g, "_" ).toLowerCase();
            
            //find the partial locale by knocking off the region portion ("en_us" becomes "en")
            var partialLocale = locale;
            var underscoreIndex = locale.indexOf( "_" );
            if ( underscoreIndex >= 0 )
            {
                partialLocale = locale.substring( 0, underscoreIndex );
            }
            
            var pathIndex;
            for ( pathIndex = 0; pathIndex < Strings.STRINGS_PATHS.length; pathIndex++ )
            {
                //first, add the full locale
                files.push( this._getSubstitutedString( Strings.STRINGS_PATHS[ pathIndex ], [ locale ] ) );
                localePerPath.push( locale );
                
                //then, do the fallback without region
                if ( partialLocale !== locale )
                {
                    files.push( this._getSubstitutedString( Strings.STRINGS_PATHS[ pathIndex ], [ partialLocale ] ) );
                    localePerPath.push( partialLocale );
                }
            }
        }
    }

    //because it's async, we define the finished function here, we'll do the callback once we're done
    var loadedFiles = {};
    var loadedCount = 0;
    var loadedFunction = function( index, str )
    {
        loadedFiles[ index ] = str;
        loadedCount++;

        if ( loadedCount >= files.length )
        {
            //assure the priority order is maintained, because of async loading they could have
            //been loaded in any order.
            var loadedFileIndex;
            for ( loadedFileIndex = 0; loadedFileIndex < files.length; loadedFileIndex++ )
            {
                //it's possible we failed to load this language table
                if ( loadedFiles[ loadedFileIndex ] )
                {
                    newLanguageTables.push( loadedFiles[ loadedFileIndex ] );
                    if( this.usedLanguage === null )
                    {
                        // Since we're using the priority order, the first one we find is the one we want.
                        this.usedLanguage = localePerPath[ loadedFileIndex ];
                    }
                }
            }

            loadingCompleted();
        }
    };

    //loop through all the files and aynchronously load each of them
    if ( files.length <= 0 )
    {
        loadingCompleted();
    }
    else
    {
        var fileIndex;
        for ( fileIndex = 0; fileIndex < files.length; fileIndex++ )
        {
            this._loadStringsFile( files[ fileIndex ], loadedFunction.bind( this, fileIndex ) );
        }
    }
};

Strings._loadStringsFile = function( path, cb )
{
    //TODO
    cb();
    
    // loadAsset( path, "json", function( stringsData )
    // {
    //     if( stringsData !== undefined )
    //     {
    //         var result = stringsData;
    //         if (result && result.json)
    //             // backwards compatability changes 1.9.2 -> 2.1.0
    //             // json objects are now nested one deep within a json property
    //             result = result.json;
    //
    //         cb(result);
    //     }
    //     else
    //     {
    //         console.warn( "Strings – Failed to load the locale strings table at " + path + ".json" );
    //         cb( undefined );
    //     }
    // }.bind( this ) );
};

Strings._getValueForKey = function( key, languageTableIndex )
{
    languageTableIndex = languageTableIndex || 0;

    //the strings have yet to be initialized
    if( !this.isInitialized() )
    {
        return "UNINITIALIZED: \"" + key + "\"";
    }

    //the string couldn't be found
    if( languageTableIndex >= this._languageTables.length )
    {
        return "ERROR: \"" + key + "\"";
    }
    
    var languageTable = this._languageTables[ languageTableIndex ];
    var keyParts = key.split( "/" );
    var parentKey = "";
    var val = languageTable;
    var partIndex;
    for( partIndex = 0; partIndex < keyParts.length; partIndex++ )
    {
        var keyPart = keyParts[ partIndex ];
    
        if( val instanceof Array )
        {
            val = this._getArrayValue( val, keyPart, parentKey );
        }
        else if( typeof( val ) === "object" )
        {
            val = val[ keyPart ];
        }
        else
        {
            val = undefined;
        }

        parentKey += keyPart;

        if( val === undefined )
        {
            // Fall back to the next language option if we couldn't find the key in this language table
            return this._getValueForKey( key, languageTableIndex + 1 );
        }
    }

    return val;
};

Strings._getSubstitutedString = function( str, substitutions )
{
    if( substitutions.length <= 0 )
    {
        return str;
    }
        
    if( str.indexOf( "{" ) < 0 )
    {
        return str;
    }

    //javascript regex magic that swaps out the substitutions properly
    return str.replace( /\{([0-9]+)\}/g, function (_, index) { return substitutions[ index ]; } );
};

Strings._getArrayValue = function( arr, keyPart, parentKey )
{
    if( keyPart === "?" )
    {
        return this._getRandomElement( arr );
    }
    else if( keyPart === "!" )
    {
        return this._getRandomExcludedElement( arr, parentKey );
    }
    else if( keyPart.charAt( 0 ) === "b" )
    {
        return this._getBoundedElement( arr, keyPart.substring( 1 ) );
    }
    else
    {
        return this._getElement( arr, keyPart );
    }
};

Strings._getRandomElement = function( arr )
{
    if( arr.length <= 0 )
    {
        return undefined;
    }

    return arr[Math.floor(Math.random() * arr.length)];
};

Strings._getRandomExcludedElement = function( arr, key )
{
    if( arr.length <= 0 )
    {
        return undefined;
    }

    //create the list for this key if it does not yet exist
    if( this._remainingArrayIndices[ key ] === undefined )
    {
        this._remainingArrayIndices[ key ] = [];
    }

    //if the list is out of options, populate it
    if( this._remainingArrayIndices[ key ].length <= 0 )
    {
        var index;
        for( index = 0; index < arr.length; index++ )
        {
            this._remainingArrayIndices[ key ].push( index );
        }
    }

    //return a random element from the list, and remove that from the list
    var randIndex = Math.floor(Math.random() * this._remainingArrayIndices[ key ].length );
    var arrIndex = this._remainingArrayIndices[ key ][ randIndex ];
    this._remainingArrayIndices[ key ].splice( randIndex, 1 );
    return arr[ arrIndex ];
};

Strings._getBoundedElement = function( arr, key )
{
    if( arr.length <= 0 )
    {
        return undefined;
    }

    if( key < 0 )
    {
        key = 0;
    } 
    else if( key >= arr.length )
    {
        key = arr.length - 1;
    }
    return arr[ key ];
};

Strings._getElement = function( arr, key )
{
    return arr[ key ];
};
