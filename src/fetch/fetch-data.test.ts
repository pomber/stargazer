import { fetchStargazers } from './fetch-data';
import { fetchViaGraphQl } from './via-graphql';
import { fetchPageViaRest, REST_PER_PAGE } from './via-rest';

// Mock the external dependencies
jest.mock('./via-graphql');
jest.mock('./via-rest');

const mockedFetchViaGraphQl = fetchViaGraphQl as jest.MockedFunction<typeof fetchViaGraphQl>;
const mockedFetchPageViaRest = fetchPageViaRest as jest.MockedFunction<typeof fetchPageViaRest>;

describe('fetchStargazers', () => {
  const mockAbortSignal = new AbortController().signal;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('when REMOTION_GITHUB_TOKEN is not set', () => {
    beforeEach(() => {
      delete process.env.REMOTION_GITHUB_TOKEN;
    });

    it('should fetch stargazers via REST API when token is not set', async () => {
      const mockStargazers = [
        { avatarUrl: 'url1', name: 'user1', date: '2022-01-01', login: 'user1' },
        { avatarUrl: 'url2', name: 'user2', date: '2022-01-02', login: 'user2' },
      ];
      
      mockedFetchPageViaRest.mockResolvedValueOnce(mockStargazers);
      
      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount: 2,
        abortSignal: mockAbortSignal,
      });

      expect(result).toEqual(mockStargazers);
      expect(mockedFetchPageViaRest).toHaveBeenCalledTimes(1);
      expect(mockedFetchViaGraphQl).not.toHaveBeenCalled();
    });

    it('should fetch multiple pages when star count exceeds page size', async () => {
      const mockStargazersPage1 = Array(REST_PER_PAGE).fill(null).map((_, i) => ({
        avatarUrl: `url${i}`,
        name: `user${i}`,
        date: `2022-01-${i+1}`,
        login: `user${i}`
      }));
      const mockStargazersPage2 = Array(50).fill(null).map((_, i) => ({
        avatarUrl: `url${i + REST_PER_PAGE}`,
        name: `user${i + REST_PER_PAGE}`,
        date: `2022-01-${i + 1}`,
        login: `user${i + REST_PER_PAGE}`
      }));

      mockedFetchPageViaRest
        .mockResolvedValueOnce(mockStargazersPage1)
        .mockResolvedValueOnce(mockStargazersPage2);

      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount: 150, // More than one page
        abortSignal: mockAbortSignal,
      });

      expect(result).toHaveLength(150);
      expect(mockedFetchPageViaRest).toHaveBeenCalledTimes(2);
      expect(mockedFetchPageViaRest).toHaveBeenNthCalledWith(1, {
        abortSignal: mockAbortSignal,
        page: 0,
        repoName: 'repo',
        repoOrg: 'test',
      });
      expect(mockedFetchPageViaRest).toHaveBeenNthCalledWith(2, {
        abortSignal: mockAbortSignal,
        page: 1,
        repoName: 'repo',
        repoOrg: 'test',
      });
    });

    it('should limit results to starCount when more stargazers are fetched', async () => {
      const mockStargazersPage1 = Array(REST_PER_PAGE).fill(null).map((_, i) => ({
        avatarUrl: `url${i}`,
        name: `user${i}`,
        date: `2022-01-${i+1}`,
        login: `user${i}`
      }));
      const mockStargazersPage2 = Array(100).fill(null).map((_, i) => ({
        avatarUrl: `url${i + REST_PER_PAGE}`,
        name: `user${i + REST_PER_PAGE}`,
        date: `2022-01-${i + 1}`,
        login: `user${i + REST_PER_PAGE}`
      }));

      mockedFetchPageViaRest
        .mockResolvedValueOnce(mockStargazersPage1)
        .mockResolvedValueOnce(mockStargazersPage2);

      const starCount = 120; // Less than total available (200)
      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount,
        abortSignal: mockAbortSignal,
      });

      expect(result).toHaveLength(starCount);
      expect(mockedFetchPageViaRest).toHaveBeenCalledTimes(2); // Should stop after getting enough results
    });

    it('should break loop if no stars are returned on a page', async () => {
      mockedFetchPageViaRest.mockResolvedValueOnce([]);

      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount: 100,
        abortSignal: mockAbortSignal,
      });

      expect(result).toEqual([]);
      expect(mockedFetchPageViaRest).toHaveBeenCalledTimes(1);
    });
  });

  describe('when REMOTION_GITHUB_TOKEN is set', () => {
    beforeEach(() => {
      process.env.REMOTION_GITHUB_TOKEN = 'test-token';
    });

    it('should fetch stargazers via GraphQL API when token is set', async () => {
      const mockQueryResult = {
        cursor: 'cursor1',
        results: [
          { avatarUrl: 'url1', name: 'user1', date: '2022-01-01', login: 'user1' },
        ],
      };
      
      mockedFetchViaGraphQl.mockResolvedValueOnce(mockQueryResult);
      
      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount: 1,
        abortSignal: mockAbortSignal,
      });

      expect(result).toEqual(mockQueryResult.results);
      expect(mockedFetchViaGraphQl).toHaveBeenCalledTimes(1);
      expect(mockedFetchPageViaRest).not.toHaveBeenCalled();
    });

    it('should fetch multiple pages via GraphQL when star count exceeds 100', async () => {
      const mockQueryResult1 = {
        cursor: 'cursor1',
        results: Array(100).fill(null).map((_, i) => ({
          avatarUrl: `url${i}`,
          name: `user${i}`,
          date: `2022-01-${i+1}`,
          login: `user${i}`
        })),
      };
      const mockQueryResult2 = {
        cursor: 'cursor2',
        results: Array(50).fill(null).map((_, i) => ({
          avatarUrl: `url${i + 100}`,
          name: `user${i + 100}`,
          date: `2022-01-${i + 1}`,
          login: `user${i + 100}`
        })),
      };
      
      mockedFetchViaGraphQl
        .mockResolvedValueOnce(mockQueryResult1)
        .mockResolvedValueOnce(mockQueryResult2);
      
      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount: 150,
        abortSignal: mockAbortSignal,
      });

      expect(result).toHaveLength(150);
      expect(mockedFetchViaGraphQl).toHaveBeenCalledTimes(2);
      expect(mockedFetchViaGraphQl).toHaveBeenNthCalledWith(1, {
        repoOrg: 'test',
        repoName: 'repo',
        count: 100,
        cursor: null,
        abortSignal: mockAbortSignal,
      });
      expect(mockedFetchViaGraphQl).toHaveBeenNthCalledWith(2, {
        repoOrg: 'test',
        repoName: 'repo',
        count: 50, // Remaining count
        cursor: 'cursor1',
        abortSignal: mockAbortSignal,
      });
    });

    it('should stop fetching when fewer results than requested are returned', async () => {
      const mockQueryResult = {
        cursor: 'cursor1',
        results: [
          { avatarUrl: 'url1', name: 'user1', date: '2022-01-01', login: 'user1' },
        ],
      };
      
      mockedFetchViaGraphQl.mockResolvedValueOnce(mockQueryResult);
      
      const result = await fetchStargazers({
        repoOrg: 'test',
        repoName: 'repo',
        starCount: 100, // Much higher than what's available
        abortSignal: mockAbortSignal,
      });

      expect(result).toEqual(mockQueryResult.results);
      expect(mockedFetchViaGraphQl).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle abort signal properly', async () => {
    // Mock fetchViaGraphQl to reject with AbortError when signal is aborted
    mockedFetchViaGraphQl.mockRejectedValueOnce(new Error('The operation was aborted.'));

    const abortController = new AbortController();
    abortController.abort(); // Immediately abort

    await expect(fetchStargazers({
      repoOrg: 'test',
      repoName: 'repo',
      starCount: 1,
      abortSignal: abortController.signal,
    })).rejects.toThrow();

    expect(mockedFetchViaGraphQl).toHaveBeenCalledTimes(1);
  });
});