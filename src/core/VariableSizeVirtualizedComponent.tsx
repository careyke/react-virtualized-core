import React, {
  FC,
  CSSProperties,
  ComponentType,
  useState,
  useMemo,
  UIEventHandler,
  useRef,
  ReactElement,
  createElement,
  useCallback,
  RefObject,
} from "react";
import memoizeOne from "memoize-one";

import { useKeyIndex } from "./keyIndexHook";

type Direction = "vertical" | "horizontal";

type ScrollDirection = "forward" | "backward";

interface ScrollConfig {
  scrollDirection: ScrollDirection;
  scrollOffset: number;
}

interface RenderItemProps {
  index: number;
  style: CSSProperties;
}

interface SizeAndOffsetCache {
  size: number;
  offset: number;
}

interface ItemSizeAndOffsetConfig {
  lastMeasuredIndex: number;
  sizeAndOffestCache: Map<number, SizeAndOffsetCache>;
}

export interface VariableSizeVirtualizedComponentProps {
  width: Key;
  height: Key;
  itemCount: number;
  itemSizeGetter: (index: number) => number;
  children: ComponentType<RenderItemProps>;
  direction?: Direction;
  overscanCount?: number;
  estimatedSize?: number;
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

const _getCacheItemStyle = memoizeOne<(...args: unknown[]) => CommonObject>(
  () => {
    return {} as CommonObject;
  }
);

const VariableSizeVirtualizedComponent: FC<VariableSizeVirtualizedComponentProps> = (
  props
) => {
  const {
    height,
    width,
    itemCount,
    itemSizeGetter,
    direction = "vertical",
    overscanCount = 5,
    estimatedSize = 50,
    children,
    innerRef,
  } = props;
  const [scrollConfig, setScrollConfig] = useState<ScrollConfig>({
    scrollDirection: "forward",
    scrollOffset: 0,
  });
  const { isVertical, visibleSize } = useMemo(() => {
    let visibleSize = 0;
    let isVertical = direction === "vertical";
    if (direction === "vertical") {
      visibleSize = height as number;
    } else {
      isVertical = false;
      visibleSize = width as number;
    }
    return { visibleSize, isVertical };
  }, [direction, height, width]);
  const itemSizeAndOffsetRef = useRef<ItemSizeAndOffsetConfig>({
    lastMeasuredIndex: -1,
    sizeAndOffestCache: new Map<number, SizeAndOffsetCache>(),
  });

  const getItemSizeAndOffset = useCallback(
    (index: number): SizeAndOffsetCache => {
      const {
        lastMeasuredIndex,
        sizeAndOffestCache,
      } = itemSizeAndOffsetRef.current;
      if (lastMeasuredIndex >= index) {
        return sizeAndOffestCache.get(index)!;
      }
      let offset = 0;
      if (lastMeasuredIndex >= 0) {
        const { size, offset: lastOffset } = sizeAndOffestCache.get(
          lastMeasuredIndex
        )!;
        offset = size + lastOffset;
      }
      for (let i = lastMeasuredIndex + 1; i <= index; i++) {
        const size = itemSizeGetter(i);
        sizeAndOffestCache.set(i, {
          offset,
          size,
        });
        offset += size;
      }
      itemSizeAndOffsetRef.current.lastMeasuredIndex = index;
      return sizeAndOffestCache.get(index)!;
    },
    [itemSizeGetter]
  );

  /**
   * 二分查找 O(logn)
   * @param start
   * @param end
   * @param scrollOffest
   * @returns
   */
  const findNearestItemIndexByBinarySearch = (
    start: number,
    end: number,
    scrollOffest: number
  ) => {
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const midOffset = getItemSizeAndOffset(mid).offset;
      if (midOffset === scrollOffest) {
        return mid;
      } else if (midOffset < scrollOffest) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    if (start > 0) {
      return start - 1;
    } else {
      return 0;
    }
  };

  /**
   * 指数查找
   * @param index
   * @param scrollOffset
   * @returns
   */
  const findNearestItemIndexByExponentialSearch = (
    index: number,
    scrollOffset: number
  ) => {
    let interval = 1;
    while (
      index + interval < itemCount &&
      getItemSizeAndOffset(index + interval).offset < scrollOffset
    ) {
      interval *= 2;
    }
    const start = index + Math.floor(interval / 2);
    const end = Math.min(itemCount - 1, start + interval);
    return findNearestItemIndexByBinarySearch(start, end, scrollOffset);
  };

  const findNearestItemIndex = (scrollOffest: number) => {
    const {
      sizeAndOffestCache,
      lastMeasuredIndex,
    } = itemSizeAndOffsetRef.current;
    const lastMeasuredOffset =
      lastMeasuredIndex > 0
        ? sizeAndOffestCache.get(lastMeasuredIndex)!.offset
        : 0;
    if (lastMeasuredOffset >= scrollOffest) {
      // 查找已缓存的结果
      return findNearestItemIndexByBinarySearch(
        0,
        lastMeasuredIndex,
        scrollOffest
      );
    } else {
      // 查找未缓存的结果
      return findNearestItemIndexByExponentialSearch(
        lastMeasuredIndex,
        scrollOffest
      );
    }
  };

  const getRenderedItemIndex = () => {
    const { scrollOffset, scrollDirection } = scrollConfig;
    const visibleStartIndex = findNearestItemIndex(scrollOffset);

    const { offset, size } = getItemSizeAndOffset(visibleStartIndex)!;
    let distance = offset + size;
    let visibleEndIndex = visibleStartIndex;
    while (
      visibleEndIndex < itemCount - 1 &&
      distance < scrollOffset + visibleSize
    ) {
      visibleEndIndex++;
      distance += getItemSizeAndOffset(visibleEndIndex).size;
    }
    if (scrollDirection === "forward") {
      return {
        renderStartIndex: visibleStartIndex,
        renderEndIndex: Math.min(
          visibleEndIndex + overscanCount,
          itemCount - 1
        ),
      };
    } else {
      return {
        renderStartIndex: Math.max(0, visibleStartIndex - overscanCount),
        renderEndIndex: visibleEndIndex,
      };
    }
  };

  const getBodySize = () => {
    const {
      lastMeasuredIndex,
      sizeAndOffestCache,
    } = itemSizeAndOffsetRef.current;
    if (lastMeasuredIndex >= 0) {
      const { offset, size } = sizeAndOffestCache.get(lastMeasuredIndex)!;
      return (
        offset + size + (itemCount - 1 - lastMeasuredIndex) * estimatedSize
      );
    } else {
      return estimatedSize * itemCount;
    }
  };

  const getItemStyle = useCallback(
    (index: number): CSSProperties => {
      const cacheStyle = _getCacheItemStyle(itemCount, direction); // 参数需要仔细考虑
      if (cacheStyle[index]) {
        return cacheStyle[index];
      } else {
        const { offset, size } = getItemSizeAndOffset(index);
        const style: CSSProperties = {
          position: "absolute",
          height: isVertical ? size : undefined,
          width: isVertical ? undefined : size,
          top: isVertical ? offset : 0,
          left: isVertical ? 0 : offset,
          right: isVertical ? 0 : undefined,
          bottom: isVertical ? undefined : 0,
        };
        cacheStyle[index] = style;
        return style;
      }
    },
    [direction, isVertical, itemCount, getItemSizeAndOffset]
  );

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

  const { renderStartIndex, renderEndIndex } = getRenderedItemIndex();
  const { getItemKeyIndex } = useKeyIndex(renderStartIndex, renderEndIndex);

  const nodes = useMemo<ReactElement[]>(() => {
    let items: ReactElement[] = [];
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
    renderStartIndex,
    renderEndIndex,
    children,
    getItemKeyIndex,
    getItemStyle,
  ]);

  const containerStyle: CSSProperties = {
    ...containerBaseStyle,
    width,
    height,
    flexDirection: isVertical ? "column" : "row",
  };
  const bodyStyle: CSSProperties = {
    ...bodyBaseStyle,
    height: isVertical ? getBodySize() : undefined,
    width: isVertical ? undefined : getBodySize(),
  };

  return (
    <div style={containerStyle} onScroll={handleScroll}>
      <div ref={innerRef} style={bodyStyle}>
        {nodes}
      </div>
    </div>
  );
};

export default VariableSizeVirtualizedComponent;
