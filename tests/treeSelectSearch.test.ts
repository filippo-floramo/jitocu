import { describe, expect, test } from "bun:test";
import { createFuzzySearcher } from "../src/helpers/fuzzySearch";
import { listCandidates, printableChar } from "../src/prompts/treeSelect";
import type { ClickUpFolder } from "../src/services/clickUp/types/folder";

const FOLDERS: ClickUpFolder[] = [
   {
      id: "f1",
      name: "Design",
      lists: [
         { id: "l1", name: "Backlog" },
         { id: "l2", name: "Sprint 12" }
      ]
   },
   {
      id: "f2",
      name: "Engineering",
      lists: [
         { id: "l3", name: "Backlog" },
         { id: "l4", name: "List" }
      ]
   }
];

/** Mirrors how treeSelect queries the index. */
function search(query: string): string[] {
   const searcher = createFuzzySearcher(listCandidates(FOLDERS), {
      selector: (candidate) => candidate.haystack,
      extendedSearch: true
   });
   return searcher(query.trim().toLowerCase()).map((candidate) => candidate.listId);
}

describe("treeSelect search", () => {
   test("typing a folder name surfaces every list inside it", () => {
      expect(search("design").sort()).toEqual(["l1", "l2"]);
   });

   test("typing a list name still matches across folders", () => {
      expect(search("backlog").sort()).toEqual(["l1", "l3"]);
   });

   test("folder and list together narrow to one list", () => {
      expect(search("design backlog")).toEqual(["l1"]);
   });

   test("terms match in either order", () => {
      expect(search("backlog design")).toEqual(["l1"]);
      expect(search("engineering backlog")).toEqual(["l3"]);
      expect(search("backlog engineering")).toEqual(["l3"]);
   });

   test("a default-named list is reachable by its folder", () => {
      expect(search("engineering list")).toContain("l4");
   });

   test("search is case insensitive", () => {
      expect(search("DESIGN").sort()).toEqual(["l1", "l2"]);
   });

   test("a folder name alone does not pull in other folders' lists", () => {
      expect(search("engineering").sort()).toEqual(["l3", "l4"]);
   });

   test("no match returns nothing", () => {
      expect(search("nonexistent zzz")).toEqual([]);
   });
});

describe("listCandidates", () => {
   test("each candidate carries both its folder and list name", () => {
      const candidates = listCandidates(FOLDERS);

      expect(candidates).toHaveLength(4);
      expect(candidates[0]).toEqual({ listId: "l1", haystack: "Design Backlog" });
      // A list literally named "List" keeps its display fallback in the haystack.
      expect(candidates[3]?.haystack).toBe("Engineering Engineering - list");
   });
});

describe("printableChar", () => {
   const key = (over: Record<string, unknown>) =>
      ({ name: "", ctrl: false, shift: false, ...over }) as never;

   test("letters come through, preserving the typed case", () => {
      expect(printableChar(key({ name: "a", sequence: "a" }))).toBe("a");
      expect(printableChar(key({ name: "z", sequence: "Z", shift: true }))).toBe("Z");
   });

   test("space comes through even though readline names it", () => {
      expect(printableChar(key({ name: "space", sequence: " " }))).toBe(" ");
   });

   test("punctuation comes through even though readline gives it no name", () => {
      for (const char of ["-", ".", "_", "!", "'", "^", "$", "|", ">"]) {
         expect(printableChar(key({ name: undefined, sequence: char }))).toBe(char);
      }
   });

   test("digits come through", () => {
      expect(printableChar(key({ name: "1", sequence: "1" }))).toBe("1");
   });

   test("control keys are rejected", () => {
      expect(printableChar(key({ name: "return", sequence: "\r" }))).toBeNull();
      expect(printableChar(key({ name: "escape", sequence: "\x1b" }))).toBeNull();
      expect(printableChar(key({ name: "backspace", sequence: "\x7f" }))).toBeNull();
      expect(printableChar(key({ name: "tab", sequence: "\t" }))).toBeNull();
   });

   test("multi-character sequences such as arrow keys are rejected", () => {
      expect(printableChar(key({ name: "up", sequence: "\x1b[A" }))).toBeNull();
   });

   test("modifier combinations are rejected", () => {
      expect(printableChar(key({ name: "c", sequence: "\x03", ctrl: true }))).toBeNull();
      expect(printableChar(key({ name: "a", sequence: "a", meta: true }))).toBeNull();
   });
});
