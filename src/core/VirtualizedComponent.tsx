import React, {
  CSSProperties,
  FC,
  UIEventHandler,
  useMemo,
  useState,
} from "react";

type ScrollDirection = "forward" | "backward";

interface ScrollConfig {
  scrollDirection: ScrollDirection;
  scrollOffset: number;
}
export interface VirtualizedComponentProps {
  width: Key;
  height: Key;
  itemCount: number;
  itemSize: number;
  direction?: "vertical" | "horizontal";
  overscanCount?: number;
}

const containerBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  border: "1px solid #aaaaaa",
};
const bodyBaseStyle: CSSProperties = {
  display: "flex",
  position: "relative",
  flexShrink: 0,
};

const validateProps = (props: VirtualizedComponentProps) => {
  const { width, height, direction = "vertical" } = props;
  const isVertical = direction === "vertical";
  if (!isVertical && typeof width !== "number") {
    throw Error(
      'An invalid "width" prop has been specified. ' +
        "Horizontal lists must specify a number for width. " +
        `"${width === null ? "null" : typeof width}" was specified.`
    );
  } else if (isVertical && typeof height !== "number") {
    throw Error(
      'An invalid "height" prop has been specified. ' +
        "Vertical lists must specify a number for height. " +
        `"${height === null ? "null" : typeof height}" was specified.`
    );
  }
};

const getRenderedItemIndex = (
  scrollOffset: number,
  itemSize: number,
  itemCount: number,
  visibleCount: number,
  overscanCount: number,
  scrollDirection: ScrollDirection
) => {
  const visibleStartIndex = Math.floor(scrollOffset / itemSize);
  if (scrollDirection === "forward") {
    return {
      renderStartIndex: visibleStartIndex,
      renderEndIndex: Math.min(
        visibleStartIndex + visibleCount + overscanCount - 1,
        itemCount - 1
      ),
    };
  } else {
    return {
      renderStartIndex: Math.max(visibleStartIndex - overscanCount, 0),
      renderEndIndex: Math.min(
        itemCount - 1,
        visibleStartIndex + visibleStartIndex - 1
      ),
    };
  }
};

const VirtualizedComponent: FC<VirtualizedComponentProps> = (props) => {
  validateProps(props);
  const {
    width,
    height,
    itemCount,
    itemSize,
    overscanCount = 5,
    direction = "vertical",
  } = props;
  const [scrollConfig, setScrollConfig] = useState<ScrollConfig>({
    scrollDirection: "forward",
    scrollOffset: 0,
  });
  const { isVertical, visibleCount, countSize } = useMemo(() => {
    let visibleCount = 0;
    let isVertical = direction === "vertical";
    if (direction === "vertical") {
      visibleCount = Math.ceil((height as number) / itemSize);
    } else {
      isVertical = false;
      visibleCount = Math.ceil((width as number) / itemSize);
    }
    return { visibleCount, isVertical, countSize: itemCount * itemSize };
  }, [direction, height, width, itemSize, itemCount]);

  const containerStyle: CSSProperties = {
    ...containerBaseStyle,
    width,
    height,
    flexDirection: isVertical ? "column" : "row",
  };
  const bodyStyle: CSSProperties = {
    ...bodyBaseStyle,
    height: isVertical ? countSize : undefined,
    width: isVertical ? undefined : countSize,
  };

  const handleScroll: UIEventHandler<HTMLDivElement> = (e) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (isVertical) {
      setScrollConfig((prevState) => {
        return {
          scrollOffset: scrollTop,
          scrollDirection:
            scrollTop > prevState.scrollOffset ? "forward" : "backward",
        };
      });
    } else {
      setScrollConfig((prevState) => {
        return {
          scrollOffset: scrollLeft,
          scrollDirection:
            scrollLeft > prevState.scrollOffset ? "forward" : "backward",
        };
      });
    }
  };

  const renderItems = () => {
    const { renderStartIndex, renderEndIndex } = getRenderedItemIndex(
      scrollConfig.scrollOffset,
      itemSize,
      itemCount,
      visibleCount,
      overscanCount,
      scrollConfig.scrollDirection
    );
    console.log(renderStartIndex, renderEndIndex);
    return null;
  };

  return (
    <div style={containerStyle} onScroll={handleScroll}>
      <div style={bodyStyle}>{renderItems()}</div>
    </div>
  );
};

export default VirtualizedComponent;
