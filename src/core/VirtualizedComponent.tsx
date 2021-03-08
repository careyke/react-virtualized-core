import React, {
  ComponentType,
  CSSProperties,
  FC,
  ReactNode,
  UIEventHandler,
  useMemo,
  useRef,
  useState,
  createElement,
  useCallback,
} from "react";
import memoizeOne from "memoize-one";

type ScrollDirection = "forward" | "backward";

interface ScrollConfig {
  scrollDirection: ScrollDirection;
  scrollOffset: number;
}

interface RenderItemProps {
  index: number;
  style: CSSProperties;
}

interface KeyIndexConfig {
  count: number;
  lastKeyIndexMap: Map<number, number>;
  releaseIndexConfig?: {
    startIndex: number;
    endIndex: number;
    currentIndex: number;
  };
}

interface RenderIndexConfig {
  renderStartIndex: number;
  renderEndIndex: number;
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
  } = props;
  const [scrollConfig, setScrollConfig] = useState<ScrollConfig>({
    scrollDirection: "forward",
    scrollOffset: 0,
  });
  const lastRenderedIndexRef = useRef<RenderIndexConfig>({
    renderStartIndex: -1,
    renderEndIndex: -1,
  });
  // 记录运算的时候与keyIndex相关的值
  const keyIndexRef = useRef<KeyIndexConfig>({
    lastKeyIndexMap: new Map<number, number>(),
    count: 0,
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
    const renderIndexConfig = getRenderedItemIndex(
      itemSize,
      itemCount,
      visibleSize,
      overscanCount,
      scrollConfig
    );
    const { renderStartIndex, renderEndIndex } = renderIndexConfig;
    const {
      renderStartIndex: lastRenderStartIndex,
      renderEndIndex: lastRenderEndIndex,
    } = lastRenderedIndexRef.current;
    const length = renderEndIndex - renderStartIndex + 1;
    if (
      renderStartIndex > lastRenderEndIndex ||
      renderEndIndex < lastRenderStartIndex
    ) {
      keyIndexRef.current.count = length;
      keyIndexRef.current.releaseIndexConfig = undefined;
    } else if (renderStartIndex <= lastRenderEndIndex) {
      keyIndexRef.current.releaseIndexConfig = {
        startIndex: lastRenderStartIndex,
        endIndex: renderStartIndex - 1,
        currentIndex: lastRenderStartIndex,
      };
    } else {
      keyIndexRef.current.releaseIndexConfig = {
        startIndex: renderEndIndex + 1,
        endIndex: lastRenderEndIndex,
        currentIndex: renderEndIndex + 1,
      };
    }
    return renderIndexConfig;
  }, [itemSize, itemCount, visibleSize, overscanCount, scrollConfig]);

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
          top: isVertical ? index * itemSize : undefined,
          left: isVertical ? undefined : index * itemSize,
        };
        cacheStyle[index] = style;
        return style;
      }
    },
    [direction, isVertical, itemSize]
  );

  /**
   * 获取每个子项的key
   */
  const getItemKey = useCallback(
    (index: number): number => {
      const {
        lastKeyIndexMap,
        count,
        releaseIndexConfig,
      } = keyIndexRef.current;
      const lastKeyIndex = lastKeyIndexMap.get(index);
      if (lastKeyIndex != null) return lastKeyIndex;
      if (releaseIndexConfig) {
        const { currentIndex, endIndex } = releaseIndexConfig;
        if (currentIndex <= endIndex) {
          releaseIndexConfig.currentIndex++;
          return lastKeyIndexMap.get(currentIndex) as number;
        } else {
          keyIndexRef.current.count++;
          return count;
        }
      }
      return index - renderStartIndex;
    },
    [renderStartIndex]
  );

  const nodes = useMemo<ReactNode[]>(() => {
    const items: ReactNode[] = [];
    const keyMap: Map<number, number> = new Map<number, number>();
    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
      const keyIndex = getItemKey(i);
      keyMap.set(i, keyIndex);

      const style = getItemStyle(i);

      const element = createElement(children, {
        key: `key${keyIndex}`,
        index: i,
        style,
      });
      items[keyIndex] = element;
    }
    console.log(renderStartIndex, renderEndIndex);
    lastRenderedIndexRef.current = {
      renderStartIndex,
      renderEndIndex,
    };
    keyIndexRef.current.lastKeyIndexMap = keyMap;
    keyIndexRef.current.releaseIndexConfig = undefined;
    return items;
  }, [children, getItemKey, getItemStyle, renderStartIndex, renderEndIndex]);

  return (
    <div style={containerStyle} onScroll={handleScroll}>
      <div style={bodyStyle}>{nodes}</div>
    </div>
  );
};

export default VirtualizedComponent;
