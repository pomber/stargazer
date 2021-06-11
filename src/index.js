import { Composition, registerRoot } from "remotion";
import { Video } from "./video";

function RemotionVideo() {
  return (
    <Composition
      id="main"
      component={Video}
      durationInFrames={60 * 8}
      fps={30}
      width={1280 / 2.5}
      height={720 / 2.5}
      defaultProps={{
        repoOrg: "code-hike",
        repoName: "codehike",
        starCount: 100,
      }}
    />
  );
}

registerRoot(RemotionVideo);
