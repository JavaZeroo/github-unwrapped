import { executeGiteeApiRequest } from "./fetch-stats.js";
import { YEAR_TO_REVIEW } from "./year.js";

interface GiteePullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export const getMorePullRequests = async ({
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
  const pullRequestData: Array<{ createdAt: string }> = [];

  while (safety < 10) {
    // Gitee doesn't have a direct "user pull requests" endpoint
    // We need to fetch events and filter for PR events
    const events = (await executeGiteeApiRequest({
      endpoint: `/users/${username}/events?page=${page}&per_page=100`,
      token,
    })) as Array<{
      type: string;
      created_at: string;
      payload?: {
        action?: string;
        pull_request?: {
          created_at: string;
        };
      };
    }> | null;

    if (!events || events.length === 0) {
      break;
    }

    let foundOldPR = false;
    for (const event of events) {
      // PullRequestEvent indicates PR activity
      if (event.type === "PullRequestEvent" && event.payload?.action === "opened") {
        const prCreatedAt = event.payload.pull_request?.created_at || event.created_at;
        if (prCreatedAt.startsWith(String(YEAR_TO_REVIEW))) {
          pullRequestData.push({ createdAt: prCreatedAt });
        } else if (new Date(prCreatedAt) < new Date(`${YEAR_TO_REVIEW}-01-01`)) {
          foundOldPR = true;
        }
      }
      
      // Check if we've gone past the year
      if (new Date(event.created_at) < new Date(`${YEAR_TO_REVIEW}-01-01`)) {
        foundOldPR = true;
      }
    }

    if (foundOldPR) {
      break;
    }

    page++;
    safety++;
  }

  return pullRequestData;
};
