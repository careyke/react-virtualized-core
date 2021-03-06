import { useMemo, useRef } from "react";

// interface LastReleaseKeyIndexConfig {
//   keyIndexArray: number[];
//   currentIndex: number;
// }

interface KeyIndexConfig {
  lastKeyIndexMap: Map<number, number>; // 缓存每个item的index与key之间的映射关系
  maxKeyIndex: number; // 当前用到的最大的keyIndex
  recycledKeyIndex: number[]; // 回收的keyIndex, 需要后进先出
  // lastReleaseKeyIndex: LastReleaseKeyIndexConfig; // 上个快照到当前快照释放的keyIndex
}

export interface RenderIndexConfig {
  renderStartIndex: number;
  renderEndIndex: number;
}

type GetItemKeyIndex = (index: number) => number;

export const useKeyIndex = (
  renderStartIndex: number,
  renderEndIndex: number
) => {
  const keyIndexRef = useRef<KeyIndexConfig>({
    lastKeyIndexMap: new Map<number, number>(),
    maxKeyIndex: 0,
    recycledKeyIndex: [],
  });
  const lastRenderedIndexRef = useRef<RenderIndexConfig>({
    renderStartIndex: -1,
    renderEndIndex: -1,
  });

  const getItemKeyIndex = useMemo<GetItemKeyIndex>(() => {
    const {
      renderStartIndex: lastRenderStartIndex,
      renderEndIndex: lastRenderEndIndex,
    } = lastRenderedIndexRef.current;

    lastRenderedIndexRef.current = {
      renderStartIndex,
      renderEndIndex,
    };
    if (
      renderStartIndex > lastRenderEndIndex ||
      renderEndIndex < lastRenderStartIndex
    ) {
      keyIndexRef.current = {
        lastKeyIndexMap: new Map<number, number>(),
        maxKeyIndex: renderEndIndex - renderStartIndex + 1,
        recycledKeyIndex: [],
      };
    }
    // 下面两种是互斥行为
    if (renderStartIndex > lastRenderStartIndex) {
      // 回收上面销毁的节点
      const { lastKeyIndexMap, recycledKeyIndex } = keyIndexRef.current;
      for (let i = lastRenderStartIndex; i < renderStartIndex; i++) {
        const lastKeyIndex = lastKeyIndexMap.get(i) as number;
        recycledKeyIndex.push(lastKeyIndex);
      }
    }
    if (renderEndIndex < lastRenderEndIndex) {
      // 收回下面销毁的节点
      const { lastKeyIndexMap, recycledKeyIndex } = keyIndexRef.current;
      for (let i = renderEndIndex + 1; i <= lastRenderEndIndex; i++) {
        const lastKeyIndex = lastKeyIndexMap.get(i) as number;
        recycledKeyIndex.push(lastKeyIndex);
      }
    }
    const newKeyIndexMap = new Map<number, number>();
    return (index: number) => {
      const {
        lastKeyIndexMap,
        recycledKeyIndex,
        maxKeyIndex,
      } = keyIndexRef.current;
      const lastKeyIndex = lastKeyIndexMap.get(index);
      let keyIndex: number = index - renderStartIndex;
      if (lastKeyIndex != null) {
        keyIndex = lastKeyIndex;
      } else if (lastKeyIndexMap.size > 0) {
        if (recycledKeyIndex.length > 0) {
          keyIndex = recycledKeyIndex.pop() as number;
        } else {
          keyIndex = maxKeyIndex;
          keyIndexRef.current.maxKeyIndex++;
        }
      }
      newKeyIndexMap.set(index, keyIndex);
      if (index === renderEndIndex) {
        // console.log(newKeyIndexMap, recycledKeyIndex);
        keyIndexRef.current.lastKeyIndexMap = newKeyIndexMap;
      }
      return keyIndex;
    };
  }, [renderStartIndex, renderEndIndex]);
  return { getItemKeyIndex };
};
