export async function fetchStargazers(repoOrg, repoName, starCount) {
  let starsLeft = starCount;
  let cursor = null;
  let allStargazers = [];

  while (starsLeft > 0) {
    const count = Math.min(starsLeft, 100);
    const result = await fetchPage(repoOrg, repoName, count, cursor);
    if (!result) return result;

    const [newCursor, page] = result;
    allStargazers = [...allStargazers, ...page];
    cursor = newCursor;
    if (page.length < count) {
      starsLeft = 0;
    } else {
      starsLeft = starsLeft - page.length;
    }
  }

  return allStargazers;
}

function fetchPage(repoOrg, repoName, count, cursor) {
  const query = `{
    repository(owner: "${repoOrg}", name: "${repoName}") {
      stargazers(first: ${count}${cursor ? `, after: "${cursor}"` : ""}) {
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
  return fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: "token " + process.env.REMOTION_GITHUB_TOKEN,
    },
    body: JSON.stringify({ query }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then((textResponse) => {
          throw Error(`HTTP ${res.status} ${res.statusText}: ${textResponse}`);
        });
      }
      return res.json();
    })
    .then((res) => {
      const { edges } = res.data.repository.stargazers;
      const lastCursor = edges[edges.length - 1].cursor;
      const page = edges.map((edge) => ({
        avatarUrl: edge.node.avatarUrl,
        date: edge.starredAt,
        name: edge.node.name || edge.node.login,
      }));
      return [lastCursor, page];
    })
    .catch((e) => console.error(e));
}
