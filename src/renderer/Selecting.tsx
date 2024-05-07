import { useAtom, useSetAtom } from "jotai";
import React, { MouseEventHandler, useState } from "react";
import {
  Article,
  articlesAtom,
  selectedArticlesAtom,
  tableAtom,
} from "./stores/articles";
import { Checkbox } from "./components/ui/checkbox";
import { Button } from "./components/ui/button";
import { useRouteStore } from "./stores/route";
import { Dialog, DialogContent, DialogTrigger } from "./components/ui/dialog";
import { LoadingSpinner } from "./components/ui/spinner";
import { useSettingsStore } from "./stores/settings";
import { extractWords } from "./lib/gemini";

const ArticleComp = ({
  article,
  toggleFn,
}: {
  article: Article;
  toggleFn: (fn: (prev: Article[]) => Article[]) => void;
}) => {
  return (
    <div
      className={
        (article.selected ? "ring-2 ring-primary dark:ring-primar " : "") +
        "flex flex-row content-center justify-between p-4 w-full h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow dark:bg-gray-950 cursor-pointer"
      }
      onClick={(e) => {
        e.preventDefault();

        toggleFn((state) =>
          state.map((prev) =>
            prev.id === article.id
              ? { ...prev, selected: !prev.selected }
              : prev
          )
        );
      }}
    >
      <div>
        <h3 className="pl-2 block text-lg font-medium text-gray-900 dark:text-gray-50">
          {article.title}
        </h3>
      </div>
      <Checkbox
        className="rounded-lg mt-[5px] mr-3"
        checked={article.selected}
      />
    </div>
  );
};

const Selecting = () => {
  const { back, next } = useRouteStore();

  const [loading, setLoading] = useState<boolean>(false);

  const [articles, setArticles] = useAtom(articlesAtom);
  const setTable = useSetAtom(tableAtom);
  const [filtered] = useAtom(selectedArticlesAtom);

  const { chromeUrl, token } = useSettingsStore();

  const handleStart = async () => {
    setLoading(true);

    const contents = await window.api.getContents(
      chromeUrl!,
      filtered.map((a) => a.link)
    );

    console.log(contents);

    if (contents.success === false) return;

    const con = contents.result.map((e) => e.replaceAll(`"`, `'`));

    const table = await extractWords(token!, con);

    if (table === null) return;

    setTable(table);

    setLoading(false);

    next();
  };

  return (
    <div className="flex flex-col">
      <div className="pl-10 pt-16 pb-6">
        <h2 className="text-3xl font-bold tracking-tight">기사 선택</h2>
        <p className="text-muted-foreground">
          용어들을 정리할 기사를 선택하세요
        </p>
      </div>
      <div className="flex flex-col gap-4 px-10">
        {articles.map((article) => (
          <ArticleComp
            key={article.id}
            article={article}
            toggleFn={setArticles}
          />
        ))}
      </div>
      <div className="flex flex-row-reverse gap-2 pr-10 mb-12 my-4">
        <Dialog open={loading}>
          <DialogTrigger asChild>
            <Button
              disabled={filtered.length === 0}
              className=""
              type="submit"
              onClick={handleStart}
            >
              추출 시작하기
            </Button>
          </DialogTrigger>
          <DialogContent
            hideCloseButton
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
            className="max-w-max"
          >
            <div>
              <LoadingSpinner />
              40초 ~ 1분 소요...
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="secondary" onClick={back}>
          이전
        </Button>
      </div>
    </div>
  );
};

export default Selecting;
