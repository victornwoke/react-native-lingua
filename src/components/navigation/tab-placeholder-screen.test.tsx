import { render, screen } from "@testing-library/react-native";
import React from "react";

import { TabPlaceholderScreen } from "./tab-placeholder-screen";

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

describe("TabPlaceholderScreen", () => {
  it("renders the provided title and description", () => {
    render(
      <TabPlaceholderScreen title="Learn" description="Lessons live here." />,
    );

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("Lessons live here.")).toBeTruthy();
  });

  it("renders different content for different props", () => {
    render(
      <TabPlaceholderScreen
        title="Chat"
        description="Chat practice with the AI tutor will appear here."
      />,
    );

    expect(screen.getByText("Chat")).toBeTruthy();
    expect(
      screen.getByText("Chat practice with the AI tutor will appear here."),
    ).toBeTruthy();
    expect(screen.queryByText("Learn")).toBeNull();
  });
});