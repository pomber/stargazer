// Mock the registerRoot function to track calls
jest.mock("remotion", () => ({
  registerRoot: jest.fn(),
}));

// Mock the Root module to avoid importing CSS and other dependencies
jest.mock("./Root", () => ({
  RemotionRoot: "MockedRemotionRoot",
}));

describe("index.ts", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call registerRoot with RemotionRoot", () => {
    // Re-import the module to ensure execution of side effects
    const originalRegisterRoot = require("remotion").registerRoot;
    const mockedRemotionRoot = require("./Root").RemotionRoot;

    require("./index");

    expect(originalRegisterRoot).toHaveBeenCalledWith(mockedRemotionRoot);
    expect(originalRegisterRoot).toHaveBeenCalledTimes(1);
  });
});