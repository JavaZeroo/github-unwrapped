import { executeGiteeApiRequest } from "./fetch-stats.js";

interface GiteeStarredRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  starred_at?: string;
}

export const getMoreStars = async ({
  username,
  token,
}: {
  username: string | null;
  token: string;
}) => {
  if (!username) {
    return [];
  }

  let page = 1;
  let safety = 0;
  const starredRepos: Array<{ name: string; owner: string }> = [];

  while (safety < 10) {
    // Gitee starred repos endpoint
    const repos = (await executeGiteeApiRequest({
      endpoint: `/users/${username}/starred?page=${page}&per_page=100&sort=created&direction=desc`,
      token,
    })) as GiteeStarredRepo[] | null;

    if (!repos || repos.length === 0) {
      break;
    }

    // Gitee doesn't provide starred_at in the API directly
    // So we fetch all starred repos (they don't have date info in standard API)
    // For now, we'll include all starred repos as we can't filter by date
    for (const repo of repos) {
      starredRepos.push({
        name: repo.name,
        owner: repo.owner.login,
      });
    }

    // If we got less than 100, we've reached the end
    if (repos.length < 100) {
      break;
    }

    page++;
    safety++;
  }

  // Since Gitee doesn't provide starred_at date, return sample of starred repos
  // Limit to recent 100 for reasonable sampling
  return starredRepos.slice(0, 100);
};
