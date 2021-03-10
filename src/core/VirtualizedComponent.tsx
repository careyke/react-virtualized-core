import React, {
  ComponentType,
  CSSProperties,
  FC,
  UIEventHandler,
  useMemo,
  useState,
  createElement,
  useCallback,
  ReactElement,
  RefObject,
} from "react";
import memoizeOne from "memoize-one";

import { useKeyIndex, RenderIndexConfig } from "./keyIndexHook";

type ScrollDirection = "forward" | "backward";

interface ScrollConfig {
  scrollDirection: ScrollDirection;
  scrollOffset: number;
}

interface RenderItemProps {
  index: number;
  style: CSSProperties;
}
interface IndexConfig extends RenderIndexConfig {
  visibleStartIndex: number;
  visibleEndIndex: number;
}
export interface VirtualizedComponentProps {
  width: Key;
  height: Key;
  itemCount: number;
  itemSize: number;
  children: ComponentType<RenderItemProps>;
  direction?: "vertical" | "horizontal";
  overscanCount?: number;
  innerRef?: RefObject<HTMLDivElement> | null;
}

const containerBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
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

/**
 * 每次返回的跨度不一定是相等的
 * @param itemSize
 * @param itemCount
 * @param visibleSize
 * @param overscanCount
 * @param scrollConfig
 */
const getRenderedItemIndex = (
  itemSize: number,
  itemCount: number,
  visibleSize: number,
  overscanCount: number,
  scrollConfig: ScrollConfig
): IndexConfig => {
  const { scrollOffset, scrollDirection } = scrollConfig;
  const visibleStartIndex = Math.floor(scrollOffset / itemSize);
  const visibleEndIndex = Math.ceil((scrollOffset + visibleSize) / itemSize);
  const indexConfig = {
    visibleStartIndex,
    visibleEndIndex,
  };
  if (scrollDirection === "forward") {
    return {
      ...indexConfig,
      renderStartIndex: visibleStartIndex,
      renderEndIndex: Math.min(visibleEndIndex + overscanCount, itemCount - 1),
    };
  } else {
    return {
      ...indexConfig,
      renderStartIndex: Math.max(visibleStartIndex - overscanCount, 0),
      renderEndIndex: Math.min(itemCount - 1, visibleEndIndex),
    };
  }
};

const _getCacheItemStyle = memoizeOne<(...args: unknown[]) => CommonObject>(
  () => {
    return {} as CommonObject;
  }
);

const VirtualizedComponent: FC<VirtualizedComponentProps> = (props) => {
  validateProps(props);
  const {
    width,
    height,
    itemCount,
    itemSize,
    overscanCount = 5,
    direction = "vertical",
    children,
    innerRef,
  } = props;
  const [scrollConfig, setScrollConfig] = useState<ScrollConfig>({
    scrollDirection: "forward",
    scrollOffset: 0,
  });
  const { isVertical, visibleSize, countSize } = useMemo(() => {
    let visibleSize = 0;
    let isVertical = direction === "vertical";
    if (direction === "vertical") {
      visibleSize = height as number;
    } else {
      isVertical = false;
      visibleSize = width as number;
    }
    return { visibleSize, isVertical, countSize: itemCount * itemSize };
  }, [direction, height, width, itemSize, itemCount]);
  const { renderStartIndex, renderEndIndex } = useMemo<IndexConfig>(() => {
    return getRenderedItemIndex(
      itemSize,
      itemCount,
      visibleSize,
      overscanCount,
      scrollConfig
    );
  }, [itemSize, itemCount, visibleSize, overscanCount, scrollConfig]);
  const { getItemKeyIndex } = useKeyIndex(renderStartIndex, renderEndIndex);

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

  /**
   * 获取子项的style
   * 绝对定位
   */
  const getItemStyle = useCallback(
    (index: number): CSSProperties => {
      const cacheStyle = _getCacheItemStyle(itemSize, direction);
      if (cacheStyle[index]) {
        return cacheStyle[index];
      } else {
        const style: CSSProperties = {
          position: "absolute",
          height: isVertical ? itemSize : undefined,
          width: isVertical ? undefined : itemSize,
          top: isVertical ? index * itemSize : 0,
          left: isVertical ? 0 : index * itemSize,
          right: isVertical ? 0 : undefined,
          bottom: isVertical ? undefined : 0,
        };
        cacheStyle[index] = style;
        return style;
      }
    },
    [direction, isVertical, itemSize]
  );

  const nodes = useMemo<ReactElement[]>(() => {
    let items: ReactElement[] = [];
    // console.log("*******************");
    // console.log("start:", renderStartIndex, "end:", renderEndIndex);
    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
      const keyIndex = getItemKeyIndex(i);

      const style = getItemStyle(i);

      const element = createElement(children, {
        key: `key${keyIndex}`,
        index: i,
        style,
      });
      items[keyIndex] = element;
    }
    // 考虑优化，空位置的优化
    items = items.filter((v) => v);
    return items;
  }, [
    children,
    getItemStyle,
    getItemKeyIndex,
    renderStartIndex,
    renderEndIndex,
  ]);

  return (
    <div style={containerStyle} onScroll={handleScroll}>
      <div style={bodyStyle} ref={innerRef}>
        {nodes}
      </div>
    </div>
  );
};

export default VirtualizedComponent;
