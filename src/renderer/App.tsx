import React from "react";
import Options from "./Options";
import { Route, useRouteStore } from "./stores/route";
import Settings from "./Settings";
import { Provider } from "jotai";
import Selecting from "./Selecting";
import Result from "./Result";

const Router = () => {
  const route = useRouteStore((state) => state.current);

  switch (route) {
    // Steps
    case Route.OPTIONS:
      return <Options />;
    case Route.SELECTING:
      return <Selecting />;
    case Route.RESULT:
      return <Result />;

    // Settings
    case Route.SETTINGS:
      return <Settings />;
  }
};

function App() {
  return (
    <Provider>
      <Router />
    </Provider>
  );
}

export default App;
