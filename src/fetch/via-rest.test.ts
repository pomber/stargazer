import { fetchPageViaRest, REST_PER_PAGE } from './via-rest';

// Mock the cache module since it's imported
jest.mock('../cache', () => ({
  Stargazer: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();

global.fetch = mockFetch;

describe('via-rest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.REMOTION_GITHUB_TOKEN;
  });

  describe('fetchPageViaRest', () => {
    it('should fetch stargazers successfully', async () => {
      // Arrange
      const mockData = [
        {
          starred_at: '2023-01-01T00:00:00Z',
          user: {
            login: 'testuser1',
            avatar_url: 'https://example.com/avatar1.jpg',
          },
        },
        {
          starred_at: '2023-01-02T00:00:00Z',
          user: {
            login: 'testuser2',
            avatar_url: 'https://example.com/avatar2.jpg',
          },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'testorg',
        repoName: 'testrepo',
        page: 1,
        abortSignal: abortController.signal,
      };

      // Act
      const result = await fetchPageViaRest(params);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/testorg/testrepo/stargazers?per_page=${REST_PER_PAGE}&page=1`,
        {
          headers: {
            Accept: "application/vnd.github.v3.star+json",
          },
          signal: abortController.signal,
        }
      );

      expect(result).toEqual([
        {
          avatarUrl: 'https://example.com/avatar1.jpg',
          login: 'testuser1',
          name: 'testuser1',
          date: '2023-01-01T00:00:00Z',
        },
        {
          avatarUrl: 'https://example.com/avatar2.jpg',
          login: 'testuser2',
          name: 'testuser2',
          date: '2023-01-02T00:00:00Z',
        },
      ]);
    });

    it('should include authorization header when REMOTION_GITHUB_TOKEN is set', async () => {
      // Arrange
      process.env.REMOTION_GITHUB_TOKEN = 'test-token';

      const mockData = [
        {
          starred_at: '2023-01-01T00:00:00Z',
          user: {
            login: 'testuser',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'testorg',
        repoName: 'testrepo',
        page: 1,
        abortSignal: abortController.signal,
      };

      // Act
      await fetchPageViaRest(params);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/testorg/testrepo/stargazers?per_page=${REST_PER_PAGE}&page=1`,
        {
          headers: {
            Accept: "application/vnd.github.v3.star+json",
            Authorization: "Bearer test-token",
          },
          signal: abortController.signal,
        }
      );
    });

    it('should throw error when response is not ok', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        url: 'https://api.github.com/repos/testorg/testrepo/stargazers?per_page=100&page=1',
        json: jest.fn().mockResolvedValue([]), // Add json method to response
      });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'testorg',
        repoName: 'testrepo',
        page: 1,
        abortSignal: abortController.signal,
      };

      // Act & Assert
      await expect(fetchPageViaRest(params)).rejects.toThrow(
        'HTTP 404 Not Found (https://api.github.com/repos/testorg/testrepo/stargazers?per_page=100&page=1)'
      );
    });

    it('should retry after rate limit delay when response is 403', async () => {
      // Mock setTimeout to resolve immediately for testing
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn(); // Immediately execute the function instead of waiting
        return {} as any; // Return a mock timeout ID
      });

      // Arrange
      const mockData = [
        {
          starred_at: '2023-01-01T00:00:00Z',
          user: {
            login: 'testuser',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ];

      // First call returns 403, second call returns success
      mockFetch
        .mockResolvedValueOnce({
          status: 403,
          ok: false,
          json: jest.fn().mockResolvedValue([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(mockData),
        });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'testorg',
        repoName: 'testrepo',
        page: 1,
        abortSignal: abortController.signal,
      };

      // Act
      const result = await fetchPageViaRest(params);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          avatarUrl: 'https://example.com/avatar.jpg',
          login: 'testuser',
          name: 'testuser',
          date: '2023-01-01T00:00:00Z',
        },
      ]);

      // Restore original setTimeout
      setTimeoutSpy.mockRestore();
    }, 10000); // Increase timeout for this test

    it('should retry after rate limit delay when response is 429', async () => {
      // Mock setTimeout to resolve immediately for testing
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn(); // Immediately execute the function instead of waiting
        return {} as any; // Return a mock timeout ID
      });

      // Arrange
      const mockData: any[] = [
        {
          starred_at: '2023-01-01T00:00:00Z',
          user: {
            login: 'testuser',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ];

      // First call returns 429, second call returns success
      mockFetch
        .mockResolvedValueOnce({
          status: 429,
          ok: false,
          json: jest.fn().mockResolvedValue([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(mockData),
        });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'testorg',
        repoName: 'testrepo',
        page: 1,
        abortSignal: abortController.signal,
      };

      // Act
      const result = await fetchPageViaRest(params);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          avatarUrl: 'https://example.com/avatar.jpg',
          login: 'testuser',
          name: 'testuser',
          date: '2023-01-01T00:00:00Z',
        },
      ]);

      // Restore original setTimeout
      setTimeoutSpy.mockRestore();
    }, 10000); // Increase timeout for this test

    it('should handle abort signal properly', async () => {
      // Arrange
      const mockData = [
        {
          starred_at: '2023-01-01T00:00:00Z',
          user: {
            login: 'testuser',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'testorg',
        repoName: 'testrepo',
        page: 1,
        abortSignal: abortController.signal,
      };

      // Act
      await fetchPageViaRest(params);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    }); // Remove timeout since no setTimeout is involved

    it('should use correct URL format', async () => {
      // Arrange
      const mockData: any[] = [];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const abortController = new AbortController();
      const params = {
        repoOrg: 'myorg',
        repoName: 'myrepo',
        page: 5,
        abortSignal: abortController.signal,
      };

      // Act
      await fetchPageViaRest(params);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/myorg/myrepo/stargazers?per_page=100&page=5',
        expect.any(Object)
      );
    });
  });

  describe('REST_PER_PAGE constant', () => {
    it('should be set to 100', () => {
      expect(REST_PER_PAGE).toBe(100);
    });
  });
});