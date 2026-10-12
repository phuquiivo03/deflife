import { describe, expect, it } from "vitest";
import { catalogSchema, roomSchema } from "@/game/content/schema";
import catalogJson from "@/game/content/items.json";
import studentRoom from "@/game/content/rooms/student.json";

describe("content schema", () => {
  it("parses catalog and room", () => {
    expect(catalogSchema.parse(catalogJson).items.length).toBeGreaterThan(10);
    expect(roomSchema.parse(studentRoom).id).toBe("student");
  });
});
