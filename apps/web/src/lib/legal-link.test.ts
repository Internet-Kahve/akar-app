import assert from "node:assert/strict";
import test from "node:test";
import { legalFromHash, withoutLegal } from "./legal-link";

test("a footer link opens the KVKK notice or the licences; anything else opens nothing", () => {
  assert.equal(legalFromHash("#view=map&belge=kvkk"), "kvkk");
  assert.equal(legalFromHash("#belge=lisanslar"), "licenses");
  assert.equal(legalFromHash("#belge=licenses&view=map"), "licenses");
  assert.equal(legalFromHash("#view=map"), null);
  assert.equal(legalFromHash("#belge=other"), null);
  assert.equal(legalFromHash(""), null);
});

test("closing the text drops only `belge` from the address", () => {
  assert.equal(withoutLegal("#view=map&belge=kvkk"), "#view=map");
  assert.equal(withoutLegal("#belge=kvkk"), "");
  assert.equal(withoutLegal("#view=detail&site=ulu-cami&belge=lisanslar"), "#view=detail&site=ulu-cami");
});
