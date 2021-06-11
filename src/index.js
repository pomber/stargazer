import {
  Composition,
  continueRender,
  delayRender,
  getInputProps,
  registerRoot,
} from "remotion";
import { Video } from "./video";
import { fetchStargazers } from "./fetch";

const defaultProps = {
  repoOrg: "code-hike",
  repoName: "codehike",
  starCount: 100,
  duration: 15,
};
const inputProps = { ...defaultProps, ...getInputProps() };

function RemotionVideo() {
  const [handle] = React.useState(() => delayRender());
  const [stargazers, setStargazers] = React.useState([]);

  React.useEffect(() => {
    const { repoOrg, repoName, starCount } = inputProps;
    fetchStargazers(repoOrg, repoName, starCount).then((stargazers) => {
      setStargazers(stargazers);
      continueRender(handle);
    });
  }, [handle]);

  return (
    <Composition
      id="main"
      component={Video}
      durationInFrames={60 * inputProps.duration}
      fps={30}
      width={960}
      height={540}
      defaultProps={{
        ...inputProps,
        stargazers,
      }}
    />
  );
}

registerRoot(RemotionVideo);
