import { CSSProperties } from "react";

export type Direction = "vertical" | "horizontal";

export type ScrollDirection = "forward" | "backward";

export interface ScrollConfig {
  scrollDirection: ScrollDirection;
  scrollOffset: number;
}

export interface RenderItemProps {
  index: number;
  style: CSSProperties;
}
