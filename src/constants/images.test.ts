import { images } from "./images";

describe("images", () => {
  it("includes the new aiTeacherAvatar entry as a remote image source", () => {
    expect(images.aiTeacherAvatar).toEqual({
      uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
    });
  });

  it("still exposes the pre-existing image entries alongside the new one", () => {
    expect(images).toHaveProperty("earth");
    expect(images).toHaveProperty("earthLanguageSelection");
    expect(images).toHaveProperty("mascotAuth");
    expect(images).toHaveProperty("mascotLogo");
    expect(images).toHaveProperty("mascotWelcome");
    expect(images).toHaveProperty("palace");
    expect(images).toHaveProperty("socialApple");
    expect(images).toHaveProperty("socialFacebook");
    expect(images).toHaveProperty("socialGoogle");
    expect(images).toHaveProperty("streakFire");
    expect(images).toHaveProperty("treasure");
  });
});