import React from "react";
import { useState } from "react";
import { JournalRankings } from "src/scrape";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { useSettingsStore } from "./stores/settings";
import { LoadingSpinner } from "./Settings";
import { useRouteStore } from "./stores/route";
import { filterArticles } from "./lib/gemini";
import { extractText, replaceDoubleQuotesWithSingleQuotes } from "./lib/utils";
import { v4 } from "uuid";
import { Article, articlesAtom } from "./stores/articles";
import { useSetAtom } from "jotai";

type Checked = DropdownMenuCheckboxItemProps["checked"];

function Options() {
  const { chromeUrl, token } = useSettingsStore();
  const { next } = useRouteStore();

  const [politics, setPolitics] = useState<Checked>(true);
  const [economy, setEconomy] = useState<Checked>(true);

  const [loading, setLoading] = useState<boolean>(false);

  const [amount, setAmount] = useState<"small" | "medium" | "large">("medium");

  const setArticles = useSetAtom(articlesAtom);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              뉴스 요약 생성기
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              옵션 선택 후 기사를 불러온 다음 요약할 것들을 선택하세요.
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label className="text-base" htmlFor="topic">
                  Topic
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">선택하기</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>주제</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={politics}
                      onCheckedChange={setPolitics}
                    >
                      정치
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={economy}
                      onCheckedChange={setEconomy}
                    >
                      경제
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <Label className="text-base" htmlFor="size">
                  Quantity
                </Label>
                <Select
                  value={amount}
                  onValueChange={(value) =>
                    setAmount(value as "small" | "medium" | "large")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select quantity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">적게</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="large">많이</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Dialog open={loading}>
              <DialogTrigger asChild>
                <Button
                  className="w-full"
                  type="submit"
                  onClick={async () => {
                    setLoading(true);

                    const rankings = await window.api.scrapeRankings(
                      chromeUrl!
                    );

                    if (rankings.success === false) return;
                    if (!token) return console.log("asdf");

                    const words = [
                      "성폭행",
                      "성행위",
                      "성추문",
                      "항문",
                      "사망",
                      "초등학생",
                      "몰카",
                      "살인",
                      "아이",
                      "학대",
                      "생리",
                      "rape",
                      "시신",
                      "필로폰",
                      "마약",
                      "기쁨조",
                      "숨져",
                      "숨진",
                      "유부녀",
                      "부적절 관계",
                      "젊은 여성",
                      "퀴어",
                      "점액질",
                      "성평등",
                      "학폭",
                      "극단적 선택",
                      "이지은의",
                    ];
                    Object.entries(rankings.result).forEach((e) => {
                      rankings.result[e[0]] = e[1]?.filter((a) => {
                        if (words.some((w) => a.title.includes(w)))
                          return false;

                        return true;
                      });
                    });

                    console.log(rankings.result);
                    const json = replaceDoubleQuotesWithSingleQuotes(
                      JSON.stringify(rankings.result)
                    );

                    const amountDict = {
                      small: 5,
                      medium: 10,
                      large: 20,
                    };

                    const topics =
                      economy === false && politics === false
                        ? ["모든 주제"]
                        : [economy ? "경제" : "", politics ? "정치" : ""];

                    const ars = await filterArticles(
                      token,
                      json,
                      "경제",
                      topics,
                      amountDict[amount]
                    );

                    if (!ars) return;

                    const articleJson = JSON.parse(ars) as {
                      title: string;
                      link: string;
                    }[];

                    const articles: Article[] = articleJson.map((article) => ({
                      id: v4(),
                      title: article.title,
                      link: article.link,
                      selected: false,
                    }));

                    setArticles(articles);

                    console.log(articles);

                    setLoading(false);

                    next();
                  }}
                >
                  기사 불러오기
                </Button>
              </DialogTrigger>
              <DialogContent
                hideCloseButton
                onInteractOutside={(e) => {
                  e.preventDefault();
                }}
                className="max-w-max"
              >
                {/* <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader> */}
                <div className="flex flex-col justify-center content-center">
                  <LoadingSpinner />
                  <p>1~2분 소요...</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
