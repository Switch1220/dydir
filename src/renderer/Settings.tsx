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
import { Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Input } from "./components/ui/input";
import { useSettingsStore } from "./stores/settings";
import { Route, useRouteStore } from "./stores/route";
import { cn } from "./lib/utils";
import { DialogClose } from "./components/ui/dialog";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

const Settings = () => {
  const [tempUrl, setTempUrl] = useState<string>("None");
  const [tempToken, setTempToken] = useState<string>("");

  const [showModal, setShowModal] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const first = useSettingsStore(
    (state) => state.chromeUrl === null && state.token === null
  );

  const persistChromeUrl = useSettingsStore((state) => state.setChromeUrl);
  const persistToken = useSettingsStore((state) => state.setToken);

  const push = useRouteStore((state) => state.push);

  if (first === false) {
    push(Route.OPTIONS);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">설정</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              실행에 필수인 항목들을 설정합니다.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-base" htmlFor="quantity">
                Chrome url
              </Label>
              <div className="flex flex-row space-x-2">
                <div className="select-none overflow-hidden flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <p className="truncate">{tempUrl}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const path = await window.api.openChromeUrlDialog();

                    if (!path) return;

                    setTempUrl(path);

                    console.log(path);
                  }}
                >
                  Browse
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-base" htmlFor="quantity">
                Gemini token
              </Label>
              <div className="flex flex-row space-x-2">
                <Input
                  placeholder="ex) AIzaSyAnEZ_NJ2RIdudzcd2wmTXcIrL7h3g60n8..."
                  onChange={(e) => setTempToken(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 float-right">
          <Dialog open={showModal}>
            <DialogTrigger asChild>
              <Button
                onClick={async () => {
                  setShowModal(true);

                  const isValidUrl = await window.api.validateChromeUrl(
                    tempUrl
                  );
                  const isValidToken = await window.api.validateToken(
                    tempToken
                  );

                  if (isValidUrl === false || isValidToken === false) {
                    console.log("url: ", isValidUrl, " token: ", isValidToken);

                    let msg = "";

                    if (isValidUrl === false && isValidToken === true) {
                      msg = "Chrome의 주소가 유효하지 않습니다.";
                    }
                    if (isValidUrl === true && isValidToken === false) {
                      msg = "유효하지 않은 Token입니다.";
                    }
                    if (isValidUrl === false && isValidToken === false) {
                      msg = "Chrome의 주소 및 Token이 유효하지 않습니다.";
                    }

                    setError(msg);
                    return;
                  }

                  persistChromeUrl(tempUrl);
                  persistToken(tempToken);

                  push(Route.OPTIONS);
                }}
              >
                {first ? "저장 후 시작하기" : "저장"}
              </Button>
            </DialogTrigger>
            <DialogContent
              hideCloseButton
              onInteractOutside={(e) => {
                e.preventDefault();
              }}
              className="max-w-max"
            >
              {error === null ? (
                <div className="flex justify-center">
                  <LoadingSpinner className="w-10 h-10" />
                </div>
              ) : (
                <div className="flex flex-col">
                  <DialogHeader>
                    <DialogTitle>오류</DialogTitle>
                    <DialogDescription>{error}</DialogDescription>
                  </DialogHeader>
                  <Button
                    className="mt-2"
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                    }}
                  >
                    닫기
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;
