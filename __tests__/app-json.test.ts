const appJson = require("../app.json");

describe("app.json iOS configuration", () => {
  it("sets an iOS bundle identifier for native builds", () => {
    expect(appJson.expo.ios.bundleIdentifier).toBe(
      "com.anonymous.Duolingo-clone",
    );
  });

  it("uses a non-empty, dot-separated reverse-DNS style bundle identifier", () => {
    expect(typeof appJson.expo.ios.bundleIdentifier).toBe("string");
    expect(appJson.expo.ios.bundleIdentifier.length).toBeGreaterThan(0);
    expect(appJson.expo.ios.bundleIdentifier).toMatch(
      /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,
    );
  });

  it("keeps the existing iOS icon configuration alongside the new bundle identifier", () => {
    expect(appJson.expo.ios.icon).toBe("./assets/expo.icon");
  });
});