import type { Node } from "hast";

export interface MarkdownNode extends Node {
  value: string
}
