import { render, screen } from "@testing-library/react-native";
import React from "react";

import AITeacherScreen from "./ai-teacher";

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

describe("AITeacherScreen", () => {
  it("renders the AI Teacher placeholder title and description", () => {
    render(<AITeacherScreen />);

    expect(screen.getByText("AI Teacher")).toBeTruthy();
    expect(
      screen.getByText("Video teacher lessons will start from this tab."),
    ).toBeTruthy();
  });
});