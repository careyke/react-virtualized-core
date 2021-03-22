import React, { FC, useRef } from "react";
import { FixedSizeList } from "react-window";
import { List, Avatar } from "antd";

const { Item } = List;

const MutativeKeyVirtualizedList: FC = () => {
  const bodyRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const observer = new MutationObserver((mutationsList) => {
  //     const mutationRecord = mutationsList[0];
  //     console.log(
  //       "MutativeKeyVirtualizedList",
  //       "add nodes:",
  //       mutationRecord.addedNodes.length,
  //       "remove nodes:",
  //       mutationRecord.removedNodes.length
  //     );
  //   });
  //   if (bodyRef.current) {
  //     observer.observe(bodyRef.current, { childList: true });
  //   }
  //   return () => {
  //     observer.disconnect();
  //   };
  // }, []);

  return (
    <FixedSizeList
      width={400}
      height={600}
      itemCount={3000}
      itemSize={80}
      innerRef={bodyRef}
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
    </FixedSizeList>
  );
};

export default MutativeKeyVirtualizedList;
