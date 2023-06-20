import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Content} from './Content';
import {Stargazer} from './fetch';
import {getProgress} from './utils';

export function Main({
	repoOrg,
	repoName,
	stargazers,
}: {
	repoOrg: string;
	repoName: string;
	stargazers: Stargazer[] | null;
}) {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const extraEnding = fps;

	if (!stargazers) {
		return null;
	}

	const progress = getProgress(
		frame,
		durationInFrames - extraEnding,
		stargazers.length,
		fps
	);

	return (
		<Content
			stargazers={stargazers}
			repoOrg={repoOrg}
			repoName={repoName}
			progress={progress}
		/>
	);
}
