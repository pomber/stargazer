import {getFromCache, QueryResult, saveResult, Stargazer} from './cache';

export async function fetchStargazers({
	repoOrg,
	repoName,
	starCount,
	abortSignal,
}: {
	repoOrg: string;
	repoName: string;
	starCount: number;
	abortSignal: AbortSignal;
}) {
	let starsLeft = starCount;
	let cursor = null;
	let allStargazers: Stargazer[] = [];

	console.log('Fetching stars...');
	while (starsLeft > 0) {
		const count = Math.min(starsLeft, 100);
		const result: QueryResult = await fetchPage({
			repoOrg,
			repoName,
			count,
			cursor,
			abortSignal,
		});

		const {cursor: newCursor, results} = result;
		allStargazers = [...allStargazers, ...results];
		console.log(`Fetched ${allStargazers.length} stars`);
		cursor = newCursor;
		if (results.length < count) {
			starsLeft = 0;
		} else {
			starsLeft -= results.length;
		}
	}

	return allStargazers;
}

async function fetchPage({
	repoOrg,
	repoName,
	count,
	cursor,
	abortSignal,
}: {
	repoOrg: string;
	repoName: string;
	count: number;
	cursor: string | null;
	abortSignal: AbortSignal;
}): Promise<QueryResult> {
	const cache = getFromCache({repoOrg, repoName, count, cursor});
	if (cache) {
		return cache;
	}

	const query = `{
		repository(owner: "${repoOrg}", name: "${repoName}") {
			stargazers(first: ${count}${cursor ? `, after: "${cursor}"` : ''}) {
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
	}`;

	if (!process.env.REMOTION_GITHUB_TOKEN) {
		throw new TypeError(
			'You need to set a REMOTION_GITHUB_TOKEN environment variable'
		);
	}

	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `token ${process.env.REMOTION_GITHUB_TOKEN}`,
		},
		signal: abortSignal,
		body: JSON.stringify({query}),
	});

	if (!res.ok) {
		const textResponse = await res.text();
		throw Error(`HTTP ${res.status} ${res.statusText}: ${textResponse}`);
	}

	const json = (await res.json()) as GitHubApiResponse;

	if ('errors' in json) {
		if (json.errors[0].type === 'RATE_LIMITED') {
			console.log('Rate limit exceeded, waiting 1 minute...');
			await new Promise((resolve) => {
				setTimeout(resolve, 60 * 1000);
			});
			return fetchPage({repoOrg, repoName, count, cursor, abortSignal});
		}
		throw new Error(JSON.stringify(json.errors));
	}
	const {edges} = json.data.repository.stargazers;
	const lastCursor = edges[edges.length - 1].cursor;

	const page: Stargazer[] = edges.map((edge) => {
		return {
			avatarUrl: edge.node.avatarUrl,
			date: edge.starredAt,
			name: edge.node.name || edge.node.login,
			login: edge.node.login,
		};
	});

	const result = {cursor: lastCursor, results: page};
	saveResult({repoOrg, repoName, count, cursor, result});

	return result;
}

type GitHubApiResponse =
	| {
			data: {
				repository: {
					stargazers: {
						edges: Edge[];
					};
				};
			};
	  }
	| {
			errors: ApiError[];
	  };

type Edge = {
	starredAt: string;
	node: {
		avatarUrl: string;
		name?: string;
		login: string;
	};
	cursor: string;
};

type ApiError =
	| {
			type: 'RATE_LIMITED';
			message: string;
	  }
	| {
			type: string;
			message: string;
	  };
