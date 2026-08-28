import { describe, expect, test } from "bun:test";
import { createFuzzySearcher, fuzzySearch } from "../src/helpers/fuzzySearch";

interface Choice {
   name: string;
   value: string;
}

const CHOICES: Choice[] = [
   { name: "PROJ-1 - Fix the login bug", value: "a" },
   { name: "PROJ-12 - Add request logging", value: "b" },
   { name: "Refactor the payment gateway", value: "c" },
   { name: "Design -> Backlog", value: "d" }
];

const selector = (choice: Choice) => choice.name;

describe("createFuzzySearcher", () => {
   test("a blank query returns every item in the original order", () => {
      const search = createFuzzySearcher(CHOICES, { selector });

      expect(search("")).toEqual(CHOICES);
      expect(search("   ")).toEqual(CHOICES);
   });

   test("matches a subsequence spread across the candidate", () => {
      const search = createFuzzySearcher(CHOICES, { selector });

      expect(search("proj1").map((c) => c.value)).toEqual(["a", "b"]);
   });

   test("ranks the tighter match first", () => {
      const search = createFuzzySearcher(CHOICES, { selector });

      expect(search("payment")[0]?.value).toBe("c");
   });

   test("returns nothing when no candidate contains the subsequence", () => {
      const search = createFuzzySearcher(CHOICES, { selector });

      expect(search("porject")).toEqual([]);
   });

   test("resolves duplicate candidate names back to distinct items", () => {
      const duplicates: Choice[] = [
         { name: "Same name", value: "first" },
         { name: "Same name", value: "second" }
      ];
      const search = createFuzzySearcher(duplicates, { selector });

      expect(search("same").map((c) => c.value).sort()).toEqual(["first", "second"]);
   });

   test("limit caps both blank and matching queries", () => {
      const search = createFuzzySearcher(CHOICES, { selector, limit: 2 });

      expect(search("")).toHaveLength(2);
      expect(search("e").length).toBeLessThanOrEqual(2);
   });

   test("an empty list is searchable", () => {
      const search = createFuzzySearcher([], { selector });

      expect(search("")).toEqual([]);
      expect(search("anything")).toEqual([]);
   });

   test("does not hand out the caller's array on a blank query", () => {
      const search = createFuzzySearcher(CHOICES, { selector });

      expect(search("")).not.toBe(CHOICES);
   });
});

describe("fuzzySearch", () => {
   test("one-shot search matches the searcher it wraps", () => {
      expect(fuzzySearch(CHOICES, "backlog", { selector }).map((c) => c.value)).toEqual(["d"]);
   });
});
