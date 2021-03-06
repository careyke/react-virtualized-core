import React, { FC } from "react";

import VirtualizedComponent from "./core/VirtualizedComponent";

const App: FC = () => {
  return (
    <VirtualizedComponent
      width={400}
      height={600}
      itemCount={1000}
      itemSize={40}
    ></VirtualizedComponent>
  );
};

export default App;
