import React, { FC } from "react";

import classes from "./App.less";
import MutativeKeyVirtualizedList from "./examples/MutativeKeyVirtualizedList";
import StableKeyVirtualizedList from "./examples/StableKeyVirtualizedList";

const App: FC = () => {
  return (
    <div className={classes.container}>
      <div>
        <div>StableKey</div>
        <div className={classes.item}>
          <StableKeyVirtualizedList />
        </div>
      </div>
      <div>
        <div>MutativeKey</div>
        <div className={classes.item}>
          <MutativeKeyVirtualizedList />
        </div>
      </div>
    </div>
  );
};

export default App;
