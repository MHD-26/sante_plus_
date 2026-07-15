import { render } from "@testing-library/react";
import Logo from "../components/Logo";
import { describe, it, expect } from "vitest";
import React from "react";

describe("Logo Component", () => {
  it("renders correctly with default props", () => {
    const { container } = render(<Logo />);
    const svgElement = container.querySelector("svg");
    expect(svgElement).not.toBeNull();
    expect(svgElement?.getAttribute("width")).toBe("48");
    expect(svgElement?.getAttribute("height")).toBe("48");
  });

  it("applies custom className and size props", () => {
    const { container } = render(<Logo className="my-custom-logo" size={100} />);
    const svgElement = container.querySelector("svg");
    expect(svgElement?.getAttribute("width")).toBe("100");
    expect(svgElement?.getAttribute("height")).toBe("100");
    expect(svgElement?.classList.contains("my-custom-logo")).toBe(true);
  });
});
