const packageJson = require("../package.json");

describe("package.json native run scripts", () => {
  it("uses expo run:android to build and launch the native android app", () => {
    expect(packageJson.scripts.android).toBe("expo run:android");
  });

  it("uses expo run:ios to build and launch the native ios app", () => {
    expect(packageJson.scripts.ios).toBe("expo run:ios");
  });

  it("no longer starts android/ios via the metro dev server shortcut", () => {
    expect(packageJson.scripts.android).not.toBe("expo start --android");
    expect(packageJson.scripts.ios).not.toBe("expo start --ios");
  });

  it("leaves the metro dev server scripts untouched", () => {
    expect(packageJson.scripts.start).toBe("expo start");
    expect(packageJson.scripts.web).toBe("expo start --web");
  });
});