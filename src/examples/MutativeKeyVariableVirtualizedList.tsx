import React, { FC, useEffect, useRef } from "react";
import { VariableSizeList } from "react-window";
import { List, Avatar } from "antd";

const { Item } = List;

const rowHeights = new Array(3000)
  .fill(true)
  .map(() => 80 + Math.round(Math.random() * 80));

const getItemSize = (index: number) => {
  return rowHeights[index];
};

// const newRowHeights = new Array(3000)
//   .fill(true)
//   .map(() => 180 + Math.round(Math.random() * 80));

// const getNewItemSize = (index: number) => newRowHeights[index];

const MutativeKeyVariableVirtualizedList: FC = () => {
  const bodyRef = useRef<HTMLDivElement>(null);
  // const [count, setCount] = useState(3000);
  // const [handleClick, setHandleClick] = useState(() => getItemSize);

  // const handleBtnClick = () => {
  //   setHandleClick(() => getNewItemSize);
  // };

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      const mutationRecord = mutationsList[0];
      console.log(
        "MutativeKeyVirtualizedList",
        "add nodes:",
        mutationRecord.addedNodes.length,
        "remove nodes:",
        mutationRecord.removedNodes.length
      );
    });
    if (bodyRef.current) {
      observer.observe(bodyRef.current, { childList: true });
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* <button onClick={handleBtnClick}>click</button> */}
      <VariableSizeList
        width={400}
        height={600}
        itemCount={3000}
        innerRef={bodyRef}
        itemSize={getItemSize}
      >
        {({ index, style }) => {
          return (
            <Item style={style}>
              <Item.Meta
                avatar={
                  <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                }
                title={<a href="https://ant.design">{`Row:${index}`}</a>}
                description="Ant Design, a design language for background applications, is refined by Ant UED Team"
              ></Item.Meta>
            </Item>
          );
        }}
      </VariableSizeList>
    </>
  );
};

export default MutativeKeyVariableVirtualizedList;
