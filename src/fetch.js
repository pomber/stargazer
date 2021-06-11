import result from "./data";

export function fetchStargazers(repoOrg, repoName, starCount) {
  const { edges } = result.data.repository.stargazers;
  return edges.map((edge) => ({
    avatarUrl: edge.node.avatarUrl,
    date: edge.starredAt,
    name: edge.node.name || edge.node.login,
  }));
}
