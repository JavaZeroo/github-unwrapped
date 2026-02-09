import { sendDiscordMessage } from "../discord.js";
import { YEAR_TO_REVIEW } from "../year.js";
import type { Commit } from "./commits.js";

const RATE_LIMIT_TOKEN = "rate-limit-token";

// Gitee event response type for push events
interface GiteeEvent {
  type: string;
  created_at: string;
  repo?: {
    name: string;
    full_name: string;
  };
  payload?: {
    commits?: Array<{
      sha: string;
      message: string;
      author?: {
        name: string;
        email: string;
      };
    }>;
  };
}

const getGiteeEvents = async (
  username: string,
  page: number,
  token: string,
): Promise<{ commits: Commit[]; isDone: boolean }> => {
  const url = new URL(`https://gitee.com/api/v5/users/${username}/events`);
  url.searchParams.append("access_token", token);
  url.searchParams.append("page", String(page));
  url.searchParams.append("per_page", "100");

  const response = await fetch(url.toString(), {
    method: "get",
    headers: {
      "content-type": "application/json",
    },
  });

  const rateLimit = response.headers.get("x-ratelimit-remaining");
  if (rateLimit && parseInt(rateLimit, 10) < 10) {
    sendDiscordMessage(`Rate limit remaining: ${rateLimit}`);
  }

  const rateLimitHit = response.status === 403 || response.status === 429;

  if (rateLimitHit) {
    sendDiscordMessage("Rate limit hit");
    throw new TypeError(RATE_LIMIT_TOKEN);
  }

  if (response.status !== 200) {
    const errorBody = await response.text();
    throw new TypeError(`Gitee API error: ${response.status} - ${errorBody}`);
  }

  const events = (await response.json()) as GiteeEvent[];

  // Filter for PushEvent types and extract commits
  const commits: Commit[] = [];
  let oldestEventDate = new Date();

  for (const event of events) {
    const eventDate = new Date(event.created_at);
    if (eventDate < oldestEventDate) {
      oldestEventDate = eventDate;
    }

    if (event.type !== "PushEvent" || !event.payload?.commits) {
      continue;
    }

    const dateStr = event.created_at;
    if (!dateStr.startsWith(String(YEAR_TO_REVIEW))) {
      continue;
    }

    const hour = dateStr.match(/T([0-9]+)/);
    if (!hour) {
      continue;
    }

    for (const commit of event.payload.commits) {
      commits.push({
        author: username,
        date: eventDate.getTime(),
        hour: Number(hour[1]),
        message: commit.message,
        repo: event.repo?.full_name || "",
        fork: false, // Gitee doesn't indicate fork in events, assume false
      });
    }
  }

  const isDone =
    events.length === 0 ||
    oldestEventDate < new Date(`${YEAR_TO_REVIEW}-01-01`);

  return {
    commits,
    isDone,
  };
};

export const getALotOfGiteeCommits = async (
  username: string,
  token: string,
): Promise<Commit[]> => {
  const listOfCommits: Commit[] = [];

  const pages = [1, 2, 3, 4, 5]; // Gitee events API might need more pages

  for (const page of pages) {
    try {
      const { commits, isDone } = await getGiteeEvents(username, page, token);
      listOfCommits.push(...commits);
      if (isDone) {
        break;
      }
    } catch (error) {
      // If we hit rate limit or other error, return what we have
      console.error("Error fetching Gitee events:", error);
      break;
    }
  }

  return listOfCommits;
};
