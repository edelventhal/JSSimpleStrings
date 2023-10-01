type AnyData = string | number | boolean | null;
type AnyDataParent = { [k: string]: AnyData } | Array<AnyData>;

interface StringsInterface {
  getString: (
    key: string,
    substitutions?: AnyDataParent,
  ) => string;
  getStringCount: (key: string) => number;
  hasString: (key: string) => boolean;
  capitalize: (str: string) => string;
  capitalizeFirstOnly: (str: string) => string;
  findAllStringKeys: (path?: string) => Array<string>;
}

type StringsFile = { [k: string]: AnyData | AnyDataParent };
export default function (stringsFiles: Array<StringsFile> | StringsFile): StringsInterface;
