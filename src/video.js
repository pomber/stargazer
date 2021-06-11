import { useCurrentFrame, useVideoConfig } from "remotion";
import { RepoHeader } from "./repo-header";
import { fetchStargazers } from "./fetch";
import { useProgress } from "./nerd";
import { Img } from "remotion";

export function Video({ repoOrg, repoName, starCount }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const stargazers = fetchStargazers(repoOrg, repoName, starCount);

  const progress = useProgress(frame, durationInFrames, stargazers.length, fps);

  return (
    <Content
      stargazers={stargazers}
      repoOrg={repoOrg}
      repoName={repoName}
      progress={progress}
    />
  );
}

function Content({ stargazers, repoOrg, repoName, progress }) {
  const gap = 102;
  const startY = 76 - gap;
  const dy = progress * gap;

  return (
    <div style={{ flex: 1, backgroundColor: "#f6f8fa", position: "relative" }}>
      {stargazers.map((stargazer, index) => {
        const isHidden = Math.abs(index - progress) > 3;
        return isHidden ? null : (
          <StarBox
            avatarUrl={stargazer.avatarUrl}
            name={stargazer.name}
            date={stargazer.date}
            repoName={repoName}
            y={startY - gap * index + dy}
            key={stargazer.name}
          />
        );
      })}

      <RepoHeader stars={Math.round(progress)} org={repoOrg} name={repoName} />
    </div>
  );
}

function StarBox({ avatarUrl, name, date, repoName, y }) {
  const d = new Date(date);
  const dateString = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div
      style={{
        // margin: "24px",
        background: "white",
        border: "1px solid #e1e4e8",
        borderRadius: 6,
        padding: 12,
        display: "flex",
        position: "absolute",
        top: 0,
        right: 24,
        left: 24,
        transform: `translateY(${y}px)`,
      }}
    >
      <Img
        width="64"
        height="64"
        src={avatarUrl}
        style={{ borderRadius: "50%" }}
      />
      <div
        style={{ display: "flex", flexDirection: "column", marginLeft: "12px" }}
      >
        <h3
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 360,
            fontWeight: 400,
          }}
        >
          {name}
        </h3>
        <div>
          starred <b>{repoName}</b>{" "}
          <span style={{ color: "#586069" }}>on {dateString}</span>
        </div>
      </div>
    </div>
  );
}
