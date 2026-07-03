import { render, screen } from "@testing-library/react-native";
import React from "react";

import ProfileScreen from "./profile";

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

describe("ProfileScreen", () => {
  it("renders the Profile placeholder title and description", () => {
    render(<ProfileScreen />);

    expect(screen.getByText("Profile")).toBeTruthy();
    expect(
      screen.getByText("XP, streaks, and account details will be shown here."),
    ).toBeTruthy();
  });
});