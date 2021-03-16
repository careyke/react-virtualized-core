import React, { FC } from "react";

import classes from "./App.less";
// import MutativeKeyVirtualizedList from "./examples/MutativeKeyVirtualizedList";
// import StableKeyVirtualizedList from "./examples/StableKeyVirtualizedList";
import StableKeyVaribleVirtualizeList from "./examples/StableKeyVaribleVirtualizeList";
import MutativeKeyVariableVirtualizedList from "./examples/MutativeKeyVariableVirtualizedList";

const App: FC = () => {
  return (
    <div className={classes.container}>
      {/* <div>
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
      </div> */}
      <div>
        <div>StableKeyVariableSize</div>
        <div className={classes.item}>
          <StableKeyVaribleVirtualizeList />
        </div>
      </div>
      <div>
        <div>MutativeKeyVariableSize</div>
        <div className={classes.item}>
          <MutativeKeyVariableVirtualizedList />
        </div>
      </div>
    </div>
  );
};

export default App;
