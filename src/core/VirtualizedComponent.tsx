import React, { CSSProperties, FC } from "react";

const containerBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
};
const bodyBaseStyle: CSSProperties = {
  display: "flex",
  position: "relative",
};

export interface VirtualizedComponentProps {
  width: Key;
  height: Key;
  itemCount: number;
  itemSize: number;
  direction?: "vertical" | "horizontal";
  overscanCount?: number;
}

const VirtualizedComponent: FC<VirtualizedComponentProps> = (props) => {
  const {
    width,
    height,
    itemCount,
    itemSize,
    direction = "vertical",
    // overscanCount = 5,
  } = props;

  const containerStyle: CSSProperties = {
    ...containerBaseStyle,
    width,
    height,
  };
  const size = itemCount * itemSize;
  const bodyStyle: CSSProperties = {
    ...bodyBaseStyle,
    height: direction === "vertical" ? size : undefined,
    width: direction === "horizontal" ? size : undefined,
  };

  return (
    <div style={containerStyle}>
      <div style={bodyStyle}></div>
    </div>
  );
};

export default VirtualizedComponent;
