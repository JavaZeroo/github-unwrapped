import { getProfileStatsFromCache, insertProfileStats } from "./db.js";
import { getStatsFromGitee } from "./get-stats-from-gitee.js";

export const getStatsFromGiteeOrCache = async ({
  username,
  token,
  refreshCache,
}: {
  username: string;
  token: string;
  refreshCache: boolean;
}) => {
  const fromCache = await getProfileStatsFromCache(username);
  if (fromCache !== null && !refreshCache) {
    return fromCache;
  }

  const stats = await getStatsFromGitee({
    loggedInWithGitee: false,
    token,
    username,
  });

  if (stats) {
    await insertProfileStats({
      type: "found",
      profile: stats,
      lowercasedUsername: stats.username.toLowerCase(),
    });
  } else {
    await insertProfileStats({
      lowercasedUsername: username.toLowerCase(),
      type: "not-found",
    });
    return "not-found";
  }

  return stats;
};
