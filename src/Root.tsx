import React from 'react';
import {
	cancelRender,
	Composition,
	continueRender,
	delayRender,
	getInputProps,
} from 'remotion';
import {fetchStargazers, Stargazer} from './fetch';
import {Main} from './Main';

const FPS = 30;

const defaultProps = {
	repoOrg: 'code-hike',
	repoName: 'codehike',
	starCount: 100,
	duration: 15,
};

const props = {...defaultProps, ...getInputProps()};

export function RemotionVideo() {
	const [handle] = React.useState(() => delayRender());
	const [stargazers, setStargazers] = React.useState<Stargazer[] | null>(null);

	React.useEffect(() => {
		const {repoOrg, repoName, starCount} = props;
		fetchStargazers(repoOrg, repoName, starCount)
			.then((stargazers) => {
				setStargazers(stargazers);
				continueRender(handle);
			})
			.catch((err) => {
				cancelRender(err);
			});
	}, [handle]);

	return (
		<Composition
			id="main"
			component={Main}
			durationInFrames={FPS * props.duration}
			fps={FPS}
			width={960}
			height={540}
			defaultProps={{
				...defaultProps,
				stargazers,
			}}
		/>
	);
}
