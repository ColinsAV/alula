import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatefulWidget } from "./statefullWidget";
import { StatefulWidgetComponent } from "./StatefulWidgetComponent";
import { Text } from "./widgets";

class NoInitState extends StatefulWidget {
  private count = 0;
  override build() {
    return Text(`count: ${this.count}`);
  }
}

// Deux versions d'une même classe, comme avant / après un hot reload.
let lastCounter: CounterV1 | null = null;
class CounterV1 extends StatefulWidget {
  count = 0;
  override initState() {
    lastCounter = this;
  }
  increment(by: number) {
    this.setState(() => { this.count += by; });
  }
  override build() {
    return Text(`v1: ${this.count}`);
  }
}
class CounterV2 extends StatefulWidget {
  count = 0;
  override build() {
    return Text(`v2: ${this.count}`);
  }
}

describe("StatefulWidget", () => {
  it("se rend sans initState (facultatif, comme en Flutter)", () => {
    render(NoInitState.new());
    expect(screen.getByText("count: 0")).toBeTruthy();
  });

  it("hot reload : applique le nouveau build() en gardant l'état", () => {
    const { rerender } = render(<StatefulWidgetComponent Component={CounterV1} />);
    const counter = lastCounter!;
    act(() => counter.increment(3));
    expect(screen.getByText("v1: 3")).toBeTruthy();

    // Même position dans l'arbre, classe remplacée : ce que fait Fast Refresh.
    rerender(<StatefulWidgetComponent Component={CounterV2} />);
    expect(screen.getByText("v2: 3")).toBeTruthy();
  });
});
