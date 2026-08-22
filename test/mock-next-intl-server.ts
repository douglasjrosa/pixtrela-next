import { createElement, type ReactNode } from "react";

import messages from "@/messages/pt-BR.json";

type MessageTree = Record<string, unknown>;

function lookup(namespace: string): Record<string, string> {
  let node: unknown = messages;
  for (const part of namespace.split(".")) {
    node = (node as MessageTree)[part];
  }
  return (node ?? {}) as Record<string, string>;
}

export function createGetTranslationsMock() {
  return async function getTranslations(namespace: string) {
    const dict = lookup(namespace);

    function t(key: string): string {
      return dict[key] ?? key;
    }

    t.rich = (
      key: string,
      values: Record<string, string | ((chunks: ReactNode) => ReactNode)> = {},
    ): ReactNode => {
      const template = dict[key] ?? key;
      const interpolated = template.replace(/\{(\w+)\}/g, (_, name: string) => {
        const value = values[name];
        return typeof value === "string" ? value : "";
      });
      const match = interpolated.match(/^(.*)<bold>(.*)<\/bold>(.*)$/);
      const wrapBold = values.bold;
      if (match && typeof wrapBold === "function") {
        return createElement(
          "span",
          null,
          match[1],
          wrapBold(match[2]),
          match[3],
        );
      }
      return interpolated;
    };

    return t;
  };
}
