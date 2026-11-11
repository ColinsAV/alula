import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatefulWidget } from "./statefullWidget";
import { Text } from "./widgets";

class NoInitState extends StatefulWidget {
  private count = 0;
  override build() {
    return Text(`count: ${this.count}`);
  }
}

describe("StatefulWidget", () => {
  it("se rend sans initState (facultatif, comme en Flutter)", () => {
    render(NoInitState.new());
    expect(screen.getByText("count: 0")).toBeTruthy();
  });
});
