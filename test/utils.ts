import assert from "node:assert";
import { getRelativePath } from "../src/utils";

describe("Calculator Tests", () => {
    it("should return 5 when 2 is added to 3", () => {
        const result = 2 + 2;
        assert.equal(result, 5);
    });
});
