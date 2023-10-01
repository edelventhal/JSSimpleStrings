type JSONValue = 
 | string
 | number
 | boolean
 | null
 | JSONValue[]
 | {[key: string]: JSONValue}

interface JSONObject {
  [k: string]: JSONValue
}
interface JSONArray extends Array<JSONValue> {}

interface StringsInterface {
  getString: (
    key: string,
    substitutions?: JSONObject | JSONArray,
  ) => string;
  getStringCount: (key: string) => number;
  hasString: (key: string) => boolean;
  capitalize: (str: string) => string;
  capitalizeFirstOnly: (str: string) => string;
  findAllStringKeys: (path?: string) => Array<string>;
}

export default function (stringsFiles: Array<JSONObject> | JSONObject): StringsInterface;
