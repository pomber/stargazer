import { fetchViaGraphQl } from "./via-graphql";
import { getFromCache, saveResult, Stargazer } from "../cache";

// Mock the cache module
jest.mock("../cache", () => ({
  getFromCache: jest.fn(),
  saveResult: jest.fn(),
  Stargazer: jest.fn(),
}));

// Mock environment variables
const mockToken = "mock-github-token";
process.env.REMOTION_GITHUB_TOKEN = mockToken;

// Mock fetch
global.fetch = jest.fn();

const mockedGetFromCache = getFromCache as jest.MockedFunction<typeof getFromCache>;
const mockedSaveResult = saveResult as jest.MockedFunction<typeof saveResult>;
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("fetchViaGraphQl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFromCache.mockReturnValue(null); // Default: no cache hit
    mockedFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          repository: {
            stargazers: {
              edges: [
                {
                  starredAt: "2023-01-01T00:00:00Z",
                  node: {
                    avatarUrl: "https://example.com/avatar.jpg",
                    name: "John Doe",
                    login: "johndoe",
                  },
                  cursor: "cursor123",
                },
              ],
            },
          },
        },
      }),
      text: jest.fn().mockResolvedValue("OK"),
    } as unknown as Response);
  });

  it("should return cached result if available", async () => {
    const mockCachedResult = {
      cursor: "cachedCursor",
      results: [
        {
          avatarUrl: "https://example.com/cached-avatar.jpg",
          date: "2023-01-01T00:00:00Z",
          name: "Cached User",
          login: "cacheduser",
        },
      ],
    };
    mockedGetFromCache.mockReturnValue(mockCachedResult);

    const result = await fetchViaGraphQl({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 10,
      cursor: null,
      abortSignal: new AbortController().signal,
    });

    expect(result).toEqual(mockCachedResult);
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(mockedSaveResult).not.toHaveBeenCalled();
  });

  it("should make a GraphQL request with correct parameters", async () => {
    const abortController = new AbortController();

    await fetchViaGraphQl({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 20,
      cursor: null,
      abortSignal: abortController.signal,
    });

    expect(mockedFetch).toHaveBeenCalledWith("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `token ${mockToken}`,
      },
      signal: abortController.signal,
      body: JSON.stringify({
        query: `{
		repository(owner: "testOrg", name: "testRepo") {
			stargazers(first: 20) {
				edges {
					starredAt
					node {
						avatarUrl
						name
						login
					}
					cursor
				}
			}
		}
	}`,
      }),
    });
  });

  it("should include cursor in GraphQL query when provided", async () => {
    await fetchViaGraphQl({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 20,
      cursor: "existingCursor",
      abortSignal: new AbortController().signal,
    });

    const fetchCall = mockedFetch.mock.calls[0];
    const query = JSON.parse((fetchCall[1] as RequestInit).body as string).query;

    expect(query).toContain(', after: "existingCursor"');
  });

  it("should handle successful response and return parsed data", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          repository: {
            stargazers: {
              edges: [
                {
                  starredAt: "2023-01-01T00:00:00Z",
                  node: {
                    avatarUrl: "https://example.com/avatar.jpg",
                    name: "John Doe",
                    login: "johndoe",
                  },
                  cursor: "cursor123",
                },
                {
                  starredAt: "2023-01-02T00:00:00Z",
                  node: {
                    avatarUrl: "https://example.com/avatar2.jpg",
                    name: null,
                    login: "janedoe",
                  },
                  cursor: "cursor456",
                },
              ],
            },
          },
        },
      }),
      text: jest.fn().mockResolvedValue("OK"),
    };
    mockedFetch.mockResolvedValue(mockResponse as unknown as Response);

    const result = await fetchViaGraphQl({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 20,
      cursor: null,
      abortSignal: new AbortController().signal,
    });

    const expectedResults: Stargazer[] = [
      {
        avatarUrl: "https://example.com/avatar.jpg",
        date: "2023-01-01T00:00:00Z",
        name: "John Doe",
        login: "johndoe",
      },
      {
        avatarUrl: "https://example.com/avatar2.jpg",
        date: "2023-01-02T00:00:00Z",
        name: "janedoe", // When name is null, it should use login
        login: "janedoe",
      },
    ];

    expect(result).toEqual({
      cursor: "cursor456", // Last cursor from the response
      results: expectedResults,
    });
  });

  it("should save result to cache", async () => {
    await fetchViaGraphQl({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 20,
      cursor: "startCursor",
      abortSignal: new AbortController().signal,
    });

    expect(mockedSaveResult).toHaveBeenCalledWith({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 20,
      cursor: "startCursor",
      result: {
        cursor: "cursor123",
        results: [
          {
            avatarUrl: "https://example.com/avatar.jpg",
            date: "2023-01-01T00:00:00Z",
            name: "John Doe",
            login: "johndoe",
          },
        ],
      },
    });
  });

  it("should throw error for HTTP error responses", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: jest.fn().mockResolvedValue("Not Found"),
    } as unknown as Response);

    await expect(
      fetchViaGraphQl({
        repoOrg: "testOrg",
        repoName: "testRepo",
        count: 20,
        cursor: null,
        abortSignal: new AbortController().signal,
      })
    ).rejects.toThrow("HTTP 404 Not Found: Not Found");
  });

  it("should handle rate limiting errors and retry", async () => {
    // Mock setTimeout to immediately execute the callback instead of waiting 60s
    const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((cb) => {
      cb(); // Immediately execute the callback instead of waiting
      return 0 as any; // Return a dummy timeout ID
    });

    // First call returns rate limit error, second call returns successful response
    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          errors: [
            {
              type: "RATE_LIMITED",
              message: "API rate limit exceeded",
            },
          ],
        }),
        text: jest.fn().mockResolvedValue("Rate limited"),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {
            repository: {
              stargazers: {
                edges: [
                  {
                    starredAt: "2023-01-01T00:00:00Z",
                    node: {
                      avatarUrl: "https://example.com/avatar.jpg",
                      name: "John Doe",
                      login: "johndoe",
                    },
                    cursor: "cursor123",
                  },
                ],
              },
            },
          },
        }),
        text: jest.fn().mockResolvedValue("OK"),
      } as unknown as Response);

    const result = await fetchViaGraphQl({
      repoOrg: "testOrg",
      repoName: "testRepo",
      count: 20,
      cursor: null,
      abortSignal: new AbortController().signal,
    });

    // Verify setTimeout was called with 60*1000 delay
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    // Verify fetch was called twice (original + retry)
    expect(mockedFetch).toHaveBeenCalledTimes(2);

    expect(result).toEqual({
      cursor: "cursor123",
      results: [
        {
          avatarUrl: "https://example.com/avatar.jpg",
          date: "2023-01-01T00:00:00Z",
          name: "John Doe",
          login: "johndoe",
        },
      ],
    });

    // Restore setTimeout
    setTimeoutSpy.mockRestore();
  }, 10000); // Increase timeout for this test

  it("should throw error for other API errors", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        errors: [
          {
            type: "FORBIDDEN",
            message: "Resource not accessible by integration",
          },
        ],
      }),
      text: jest.fn().mockResolvedValue("OK"),
    } as unknown as Response);

    await expect(
      fetchViaGraphQl({
        repoOrg: "testOrg",
        repoName: "testRepo",
        count: 20,
        cursor: null,
        abortSignal: new AbortController().signal,
      })
    ).rejects.toThrow(
      '[{"type":"FORBIDDEN","message":"Resource not accessible by integration"}]'
    );
  });

  it("should handle abort signal correctly", async () => {
    // Mock fetch to throw AbortError when signal is aborted
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    // Abort the signal immediately before calling fetch
    abortController.abort();

    // Mock fetch to reject with AbortError when signal is aborted
    mockedFetch.mockRejectedValue(new Error('The operation was aborted.'));

    await expect(
      fetchViaGraphQl({
        repoOrg: "testOrg",
        repoName: "testRepo",
        count: 20,
        cursor: null,
        abortSignal,
      })
    ).rejects.toThrow('The operation was aborted.');
  });
});