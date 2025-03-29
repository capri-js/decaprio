import {
  CmsFieldBoolean,
  CmsFieldNumber,
  EditorComponentField,
  EditorComponentOptions,
} from "decap-cms-app";
import {
  Field,
  MultiSelectField,
  MultiWidgetListField,
  ObjectField,
  SelectField,
  SingleWidgetListField,
  StringField,
  VariableListField,
} from "./decap-types.js";
import { ReactElement } from "react";

type InferEditorCompontentProps<F extends EditorComponentField[]> = {
  [K in F[number] as K["name"]]: InferEditorFieldType<K["label"]>;
};

// This is very much like InferFieldType from field-inference.ts but much simpler
// as it does not support resolving relations and therefore does not need to
// know anything about the collection registry.

export type InferEditorFieldType<F> = F extends StringField
  ? string
  : F extends CmsFieldNumber
  ? number
  : F extends CmsFieldBoolean
  ? boolean
  : F extends SelectField
  ? F["options"][number]
  : F extends MultiSelectField
  ? string[]
  : F extends VariableListField
  ? Array<InferVariableEditorListItem<F>>
  : F extends SingleWidgetListField
  ? Array<InferEditorFieldType<F["field"]>>
  : F extends MultiWidgetListField
  ? Array<InferFields<F["fields"]>>
  : F extends ObjectField
  ? InferFields<F["fields"]>
  : unknown;

export type InferVariableEditorListItem<F extends VariableListField> = {
  [K in F["types"][number] as K["name"]]: InferFields<K["fields"]> & {
    type: K["name"];
  };
}[F["types"][number]["name"]];

export type InferFields<F extends readonly [...Field[]]> = {
  [K in F[number] as K["name"]]: K extends { required: false }
    ? InferEditorFieldType<K> | undefined
    : InferEditorFieldType<K>;
} extends infer T
  ? {
      [P in keyof T as undefined extends T[P] ? never : P]: T[P];
    } & {
      [P in keyof T as undefined extends T[P] ? P : never]?: Exclude<
        T[P],
        undefined
      >;
    }
  : never;

type EditOpts<F extends EditorComponentField[]> = Omit<
  EditorComponentOptions,
  "fields" | "fromBlock" | "toBlock" | "toPreview"
> & {
  fields: F;
  toPreview: (props: InferEditorCompontentProps<F>) => ReactElement;
};

export type ReactEditorComponentOptions = Omit<
  EditorComponentOptions,
  "toPreview"
> & {
  toPreview: (props: any) => ReactElement;
};

export function editorComponent<T extends EditOpts<any>>(
  opts: T
): ReactEditorComponentOptions {
  return {
    ...opts,
    pattern: new RegExp(`^<${opts.id}\\s+(.*?)\\s*/>`, "s"),
    fromBlock(match) {
      const [, props] = match;
      const regex = /(\w+)="(.*?)"/g;
      const result: Record<string, string> = {};
      let m;
      while ((m = regex.exec(props)) !== null) {
        result[m[1]] = m[2];
      }
      return result;
    },
    toBlock(data) {
      const attrs = Object.entries(data)
        .map(([key, value]) => `${key}="${htmlEncode(value as string)}"`)
        .join(" ");
      return `<${opts.id} ${attrs} />`;
    },
  };
}

function htmlEncode(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/>/g, "&gt;");
}
