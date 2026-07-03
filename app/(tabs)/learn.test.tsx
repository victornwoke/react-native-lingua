import { render, screen } from "@testing-library/react-native";
import React from "react";

import LearnScreen from "./learn";

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

describe("LearnScreen", () => {
  it("renders the Learn placeholder title and description", () => {
    render(<LearnScreen />);

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(
      screen.getByText("Lesson paths and practice cards will live here."),
    ).toBeTruthy();
  });
});