import React, { FC } from "react";

import classes from "./App.less";
import MutativeKeyVirtualizedList from "./examples/MutativeKeyVirtualizedList";
import StableKeyVirtualizedList from "./examples/StableKeyVirtualizedList";

const App: FC = () => {
  return (
    <div className={classes.container}>
      <div className={classes.item}>
        <StableKeyVirtualizedList />
      </div>
      <div className={classes.item}>
        <MutativeKeyVirtualizedList />
      </div>
    </div>
  );
};

export default App;
