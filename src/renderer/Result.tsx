import React from "react";
import { useRouteStore } from "./stores/route";
import { useAtom, useAtomValue } from "jotai";
import { selectedArticlesAtom, tableAtom } from "./stores/articles";
import Markdown from "react-markdown";
import gfm from "remark-gfm";
import { Button } from "./components/ui/button";

import "./table.css";

const Result = () => {
  const { back, next } = useRouteStore();
  const [filtered] = useAtom(selectedArticlesAtom);
  const table = useAtomValue(tableAtom);

  console.log(table);

  return (
    <div>
      <Markdown className="px-8 pt-6" remarkPlugins={[gfm]} children={table} />
      <Button className="ml-8 mt-2 mb-10" onClick={back}>
        back
      </Button>
    </div>
  );
};

export default Result;
