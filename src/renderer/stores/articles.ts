import { atom } from "jotai";
import { v4 } from "uuid";

export interface Article {
  id: string;
  title: string;
  link: string;
  selected: boolean;
}

export const articlesAtom = atom<Article[]>([]);

export const selectedArticlesAtom = atom((get) =>
  get(articlesAtom).filter((art) => art.selected)
);

export const tableAtom = atom<string>("");
