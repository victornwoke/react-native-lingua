import { render, screen } from "@testing-library/react-native";
import React from "react";

import ChatScreen from "./chat";

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

describe("ChatScreen", () => {
  it("renders the Chat placeholder title and description", () => {
    render(<ChatScreen />);

    expect(screen.getByText("Chat")).toBeTruthy();
    expect(
      screen.getByText("Chat practice with the AI tutor will appear here."),
    ).toBeTruthy();
  });
});