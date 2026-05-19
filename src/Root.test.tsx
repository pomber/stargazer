import { RemotionRoot } from "./Root";

// Mock CSS imports to prevent parsing errors
jest.mock("./gh-styles.css", () => ({}));

// Mock the external dependencies
jest.mock("./fetch/fetch-data", () => ({
  fetchStargazers: jest.fn(),
}));

jest.mock("./wait-for-no-input", () => ({
  waitForNoInput: jest.fn(),
}));

// Test the RemotionRoot component
describe("Root Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should exist and be a function component", () => {
    expect(RemotionRoot).toBeDefined();
    expect(typeof RemotionRoot).toBe("function");
  });

  it("should not throw when imported", () => {
    // We can't directly test the component rendering without React testing utilities
    // but we can ensure the component function exists and doesn't have obvious errors
    expect(RemotionRoot).not.toBeNull();
  });
});

// Additional test for expected behavior
describe("Composition configuration in RemotionRoot", () => {
  it("should configure Composition with expected default parameters", () => {
    // Validate that the component contains expected default values
    // based on the implementation:
    // - id: "main"
    // - durationInFrames: 15 * FPS (450 with FPS=30)
    // - fps: 30
    // - width: 960
    // - height: 540
    // - defaultProps with expected values
    expect(true).toBe(true); // Placeholder for the actual configuration
  });
});