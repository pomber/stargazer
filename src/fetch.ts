export type Stargazer = {
	avatarUrl: string;
	name: string;
	date: string;
};

export async function fetchStargazers(
	repoOrg: string,
	repoName: string,
	starCount: number
) {
	let starsLeft = starCount;
	let cursor = null;
	let allStargazers: Stargazer[] = [];

	console.log('Fetching stars...');
	while (starsLeft > 0) {
		const count = Math.min(starsLeft, 100);
		const result = await fetchPage({repoOrg, repoName, count, cursor});

		const {cursor: newCursor, page} = result;
		allStargazers = [...allStargazers, ...page];
		console.log('Fetched ', allStargazers.length, ' stars');
		cursor = newCursor;
		if (page.length < count) {
			starsLeft = 0;
		} else {
			starsLeft -= page.length;
		}
	}

	return allStargazers;
}

async function fetchPage({
	repoOrg,
	repoName,
	count,
	cursor,
}: {
	repoOrg: string;
	repoName: string;
	count: number;
	cursor: string | null;
}): Promise<{cursor: string; page: Stargazer[]}> {
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
		body: JSON.stringify({query}),
	});

	if (!res.ok) {
		const textResponse = await res.text();
		throw Error(`HTTP ${res.status} ${res.statusText}: ${textResponse}`);
	}

	const json = (await res.json()) as GitHubApiResponse;
	if (!json.data) {
		throw new Error(JSON.stringify(json));
	}
	const {edges} = json.data.repository.stargazers;
	const lastCursor = edges[edges.length - 1].cursor;
	const page: Stargazer[] = edges.map((edge) => {
		return {
			avatarUrl: edge.node.avatarUrl,
			date: edge.starredAt,
			name: edge.node.name || edge.node.login,
		};
	});
	return {cursor: lastCursor, page};
}

interface GitHubApiResponse {
	data: {
		repository: {
			stargazers: {
				edges: Edge[];
			};
		};
	};
}

interface Edge {
	starredAt: string;
	node: {
		avatarUrl: string;
		name?: string;
		login: string;
	};
	cursor: string;
}
