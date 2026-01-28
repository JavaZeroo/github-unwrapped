import { interpolate } from "remotion";
import type { Hour, ProfileStats } from "../config.js";
import { getMostProductive } from "./commits/commits.js";
import { getTimesOfDay } from "./commits/get-times-of-day.js";
import { getALotOfGiteeCommits } from "./commits/gitee-commits.js";
import { executeGiteeApiRequest } from "./fetch-stats.js";
import { getMorePullRequests } from "./get-more-pull-requests.js";
import { getMoreStars } from "./get-more-stars.js";
import { YEAR_TO_REVIEW } from "./year.js";

const NOT_LANGUAGES = [
  "html",
  "markdown",
  "dockerfile",
  "roff",
  "rich text format",
];

const NOT_LANGUAGES_OBJ = Object.fromEntries(
  NOT_LANGUAGES.map((l) => [l, true]),
);

// Gitee user response type
interface GiteeUser {
  login: string;
  avatar_url: string;
  name: string;
}

// Gitee repo response type
interface GiteeRepo {
  name: string;
  full_name: string;
  language: string | null;
  owner: {
    login: string;
  };
}

// Gitee issue response type
interface GiteeIssue {
  state: string;
  created_at: string;
}

// Gitee contribution data (events)
interface GiteeEvent {
  type: string;
  created_at: string;
  repo?: {
    name: string;
  };
}

export const getStatsFromGitee = async ({
  username,
  token,
  loggedInWithGitee,
}: {
  username: string | null;
  token: string;
  loggedInWithGitee: boolean;
}): Promise<ProfileStats | null> => {
  const fetchedAt = Date.now();

  // Get user info
  let actualUsername = username;
  if (username === null) {
    const userData = (await executeGiteeApiRequest({
      endpoint: "/user",
      token,
    })) as GiteeUser | null;
    if (!userData) {
      return null;
    }
    actualUsername = userData.login;
  }

  const userData = (await executeGiteeApiRequest({
    endpoint: `/users/${actualUsername}`,
    token,
  })) as GiteeUser | null;

  if (!userData) {
    return null;
  }

  // Fetch user's repos to get language stats
  const repos = (await executeGiteeApiRequest({
    endpoint: `/users/${actualUsername}/repos?type=all&per_page=100`,
    token,
  })) as GiteeRepo[] | null;

  // Fetch issues
  const issues = (await executeGiteeApiRequest({
    endpoint: `/users/${actualUsername}/issues?state=all&per_page=100&since=${YEAR_TO_REVIEW}-01-01T00:00:00Z`,
    token,
  })) as GiteeIssue[] | null;

  // Fetch events for contribution data
  const events = (await executeGiteeApiRequest({
    endpoint: `/users/${actualUsername}/events?per_page=100`,
    token,
  })) as GiteeEvent[] | null;

  // Get commits, pull requests, and starred repos in parallel
  const [commits, morePullRequests, stars] = await Promise.all([
    getALotOfGiteeCommits(actualUsername!, token),
    getMorePullRequests({ username: actualUsername, token }),
    getMoreStars({ token, username: actualUsername }),
  ]);

  // Calculate language statistics from repos
  const acc: Record<string, { color: string | null; value: number }> = {};

  if (repos) {
    repos.forEach((repo) => {
      if (
        repo.language &&
        !NOT_LANGUAGES_OBJ[repo.language.toLowerCase()]
      ) {
        acc[repo.language] = {
          color: null, // Gitee doesn't provide language colors
          value: (acc[repo.language]?.value || 0) + 1,
        };
      }
    });
  }

  const valuesAddedTogether = Object.values(acc).reduce(
    (a, i) => a + i.value,
    0,
  );

  const topLanguages = Object.entries(acc)
    .sort((a, b) => b[1].value - a[1].value)
    .map((i) => {
      return {
        languageName: i[0],
        color: i[1].color,
        percent: valuesAddedTogether > 0 ? i[1].value / valuesAddedTogether : 0,
      };
    })
    .slice(0, 3);

  const productivity = getMostProductive(commits);

  const bestHours = getTimesOfDay(commits);
  const values = Object.entries(bestHours);
  const most = Math.max(...values.map((v) => v[1]), 0);

  const mostHour = values.find(([, b]) => b === most) || ["12", 0];

  const graphData = Object.entries(getTimesOfDay(commits)).map(
    ([key, entry]) => {
      return {
        productivity: entry,
        time: Number(key),
      };
    },
  );

  // Calculate contribution data from events
  const contributionsByDate: Record<string, number> = {};
  const startOfYear = new Date(`${YEAR_TO_REVIEW}-01-01`);
  const endOfYear = new Date(`${YEAR_TO_REVIEW}-12-31`);

  // Initialize all days of the year
  for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
    contributionsByDate[d.toISOString().split("T")[0]] = 0;
  }

  // Count events by date
  if (events) {
    events.forEach((event) => {
      const eventDate = event.created_at.split("T")[0];
      if (eventDate.startsWith(String(YEAR_TO_REVIEW))) {
        contributionsByDate[eventDate] = (contributionsByDate[eventDate] || 0) + 1;
      }
    });
  }

  const contributionData = Object.values(contributionsByDate);
  const totalContributions = contributionData.reduce((a, b) => a + b, 0);

  // Calculate longest streak
  let longestStreak = 0;
  let currentStreak = 0;
  for (const count of contributionData) {
    if (count > 0) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Count open/closed issues
  let openIssues = 0;
  let closedIssues = 0;
  if (issues) {
    issues.forEach((issue) => {
      if (issue.created_at.startsWith(String(YEAR_TO_REVIEW))) {
        if (issue.state === "open") {
          openIssues++;
        } else {
          closedIssues++;
        }
      }
    });
  }

  return {
    longestStreak,
    totalPullRequests: morePullRequests.length,
    topLanguages,
    totalStars: stars.length,
    totalContributions,
    closedIssues,
    openIssues,
    fetchedAt,
    loggedInWithGitee,
    username: userData.login,
    lowercasedUsername: userData.login.toLowerCase(),
    bestHours: getTimesOfDay(commits),
    topWeekday: productivity.most,
    topHour: String(mostHour[0]) as Hour,
    graphData,
    contributionData,
    sampleStarredRepos: stars.map((s) => ({ name: s.name, author: s.owner })),
    allWeekdays: productivity.days,
  };
};
