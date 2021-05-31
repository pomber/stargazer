import { useCurrentFrame, useVideoConfig } from "remotion";
import { RepoHeader } from "./repo-header";

export function Video({ repoOrg, repoName, starCount }) {
  const frame = useCurrentFrame();
  const videoConfig = useVideoConfig();

  return (
    <div style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <RepoHeader stars={frame} org={repoOrg} name={repoName} />
      <div
        style={{
          margin: 24,
          background: "white",
          border: "1px solid #e1e4e8",
          borderRadius: 6,
          padding: 18,
        }}
      >
        Hello
      </div>
    </div>
  );
}
