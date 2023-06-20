import {z} from 'zod';

export type QueryResult = {
	cursor: string;
	results: Stargazer[];
};

export const stargazerSchema = z.object({
	avatarUrl: z.string(),
	name: z.string(),
	date: z.string(),
	login: z.string(),
});

export type Stargazer = z.infer<typeof stargazerSchema>;

const makeKey = ({
	count,
	cursor,
	repoName,
	repoOrg,
}: {
	repoOrg: string;
	repoName: string;
	count: number;
	cursor: string | null;
}) => {
	return ['__stargazer', repoOrg, repoName, count, cursor].join('-');
};

export const saveResult = ({
	count,
	cursor,
	repoName,
	repoOrg,
	result,
}: {
	repoOrg: string;
	repoName: string;
	count: number;
	cursor: string | null;
	result: QueryResult;
}) => {
	const key = makeKey({count, cursor, repoName, repoOrg});
	window.localStorage.setItem(key, JSON.stringify(result));
};

export const getFromCache = ({
	count,
	cursor,
	repoName,
	repoOrg,
}: {
	repoOrg: string;
	repoName: string;
	count: number;
	cursor: string | null;
}): QueryResult | null => {
	const key = makeKey({count, cursor, repoName, repoOrg});
	const value = window.localStorage.getItem(key);
	if (!value) {
		return null;
	}
	return JSON.parse(value);
};
