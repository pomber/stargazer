import React from "react";
import {
  cancelRender,
  Composition,
  continueRender,
  delayRender,
  getInputProps,
} from "remotion";
import { Main } from "./Content";
import { fetchStargazers, Stargazer } from "./fetch";

const FPS = 30;

const defaultProps = {
  repoOrg: "code-hike",
  repoName: "codehike",
  starCount: 100,
  duration: 15,
};

const inputProps = { ...defaultProps, ...getInputProps() };

export function RemotionVideo() {
  const [handle] = React.useState(() => delayRender());
  const [stargazers, setStargazers] = React.useState<Stargazer[] | null>(null);

  React.useEffect(() => {
    const { repoOrg, repoName, starCount } = inputProps;
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
      durationInFrames={FPS * inputProps.duration}
      fps={FPS}
      width={960}
      height={540}
      defaultProps={{
        ...inputProps,
        stargazers,
      }}
    />
  );
}
