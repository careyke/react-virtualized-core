import React, { FC } from "react";

import VirtualizedComponent from "./core/VirtualizedComponent";

const App: FC = () => {
  return (
    <VirtualizedComponent
      width={400}
      height={555}
      itemCount={300}
      itemSize={40}
    >
      {({ index, style }) => {
        return <div style={style}>{`Row:${index}`}</div>;
      }}
    </VirtualizedComponent>
  );
};

export default App;
