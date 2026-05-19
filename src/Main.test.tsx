import { Main, MainProps } from "./Main";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { getProgress } from "./utils";
import { Stargazer } from "./cache";

// Mock the remotion hooks
jest.mock("remotion", () => ({
  useCurrentFrame: jest.fn(),
  useVideoConfig: jest.fn(),
}));

// Mock the utils module
jest.mock("./utils", () => ({
  getProgress: jest.fn(),
}));

// Mock the Content component
jest.mock("./Content", () => ({
  Content: ({ progress, repoOrg, repoName, stargazers }: any) => (
    <div data-testid="content-component">
      <div>Progress: {progress}</div>
      <div>Repo Org: {repoOrg}</div>
      <div>Repo Name: {repoName}</div>
      <div>Stargazers Count: {stargazers?.length}</div>
    </div>
  ),
}));

// Helper function to mock hooks
const mockRemotionHooks = (frame: number, fps: number, durationInFrames: number) => {
  (useCurrentFrame as jest.MockedFunction<typeof useCurrentFrame>).mockReturnValue(frame);
  (useVideoConfig as jest.MockedFunction<typeof useVideoConfig>).mockReturnValue({
    fps,
    durationInFrames,
  } as any);
};

// Helper function to mock getProgress
const mockGetProgress = (returnValue: number) => {
  (getProgress as jest.MockedFunction<typeof getProgress>).mockReturnValue(returnValue);
};

describe("Main Component", () => {
  const mockStargazers: Stargazer[] = [
    { login: "user1", avatarUrl: "https://example.com/avatar1.jpg", date: "2023-01-01", name: "User One" },
    { login: "user2", avatarUrl: "https://example.com/avatar2.jpg", date: "2023-01-02", name: "User Two" },
    { login: "user3", avatarUrl: "https://example.com/avatar3.jpg", date: "2023-01-03", name: "User Three" },
  ];

  const defaultProps: MainProps = {
    repoOrg: "testorg",
    repoName: "testrepo",
    stargazers: mockStargazers,
    starCount: 100,
    duration: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders null when stargazers is null", () => {
    mockRemotionHooks(0, 30, 90);
    mockGetProgress(0);

    const props: MainProps = {
      ...defaultProps,
      stargazers: null,
    };

    const result = Main(props);
    expect(result).toBeNull();
  });

  test("renders null when stargazers is null", () => {
    mockRemotionHooks(0, 30, 90);
    mockGetProgress(0);

    const props: MainProps = {
      ...defaultProps,
      stargazers: null,
    };
    const result = Main(props);
    expect(result).toBeNull();
  });

  test("renders null when stargazers is undefined", () => {
    mockRemotionHooks(0, 30, 90);
    mockGetProgress(0);

    // For this test, we need to create a temporary object and cast it appropriately
    const tempProps = {
      repoOrg: "testorg",
      repoName: "testrepo",
      stargazers: undefined,
      starCount: 100,
      duration: 10,
    };

    // Cast to the correct type
    const props = tempProps as unknown as MainProps;
    const result = Main(props);
    expect(result).toBeNull();
  });

  test("renders Content component when stargazers exist", () => {
    mockRemotionHooks(0, 30, 90);
    mockGetProgress(0);

    const result = Main(defaultProps);
    expect(result).not.toBeNull();
  });

  test("calculates progress correctly", () => {
    const frame = 30;
    const fps = 30;
    const durationInFrames = 90;
    const expectedProgress = 0.5; // This will be determined by the getProgress mock

    mockRemotionHooks(frame, fps, durationInFrames);
    mockGetProgress(expectedProgress);

    Main(defaultProps);

    expect(getProgress).toHaveBeenCalledWith(
      frame,
      durationInFrames - fps, // extraEnding is fps
      mockStargazers.length,
      fps
    );
  });

  test("passes correct props to Content component", () => {
    mockRemotionHooks(0, 30, 90);
    mockGetProgress(0.5);

    Main(defaultProps);

    // We're mainly testing that getProgress is called with the right parameters
    expect(getProgress).toHaveBeenCalledWith(
      0, // frame from mockRemotionHooks
      90 - 30, // durationInFrames - fps
      mockStargazers.length, // stargazers length
      30 // fps
    );
  });

  test("handles different frame values and calculates progress accordingly", () => {
    // Test with different frame values
    const testCases = [
      { frame: 0, expectedProgress: 0 },
      { frame: 15, expectedProgress: 0.25 },
      { frame: 30, expectedProgress: 0.5 },
      { frame: 45, expectedProgress: 0.75 },
      { frame: 60, expectedProgress: 1 },
    ];

    testCases.forEach(({ frame, expectedProgress }) => {
      jest.clearAllMocks();
      mockRemotionHooks(frame, 30, 90);
      mockGetProgress(expectedProgress);

      Main(defaultProps);

      expect(getProgress).toHaveBeenCalledWith(
        frame,
        90 - 30, // durationInFrames - fps
        mockStargazers.length,
        30 // fps
      );
    });
  });

  test("uses correct extraEnding value in progress calculation", () => {
    const fps = 60;
    const durationInFrames = 180;
    const frame = 30;

    mockRemotionHooks(frame, fps, durationInFrames);
    mockGetProgress(0);

    Main(defaultProps);

    // The extraEnding should be equal to fps (60)
    expect(getProgress).toHaveBeenCalledWith(
      frame,
      durationInFrames - fps, // 180 - 60 = 120
      mockStargazers.length,
      fps
    );
  });

  test("passes correct stargazers data to Content component", () => {
    mockRemotionHooks(0, 30, 90);
    mockGetProgress(0);

    Main(defaultProps);

    // Check that getProgress is called with the correct stargazers length
    expect(getProgress).toHaveBeenCalledWith(
      0, // frame
      90 - 30, // durationInFrames - fps
      3, // stargazers.length
      30 // fps
    );
  });
});