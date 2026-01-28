import type { Request, Response } from "express";
import { StatsRequest } from "../config.js";
import {
  clearIgStoriesForUsername,
  clearOgImagesForUsername,
  clearRendersForUsername,
  getResetAttempts,
  registerResetAttempt,
} from "./db.js";
import { sendDiscordMessage } from "./discord.js";
import { getStatsFromGiteeOrCache } from "./get-stats-from-gitee-or-cache.js";
import { getRandomGiteeToken } from "./gitee-token.js";

// Helper function to make Gitee API requests
export const executeGiteeApiRequest = async ({
  endpoint,
  token,
  method = "GET",
}: {
  endpoint: string;
  token: string;
  method?: string;
}) => {
  const url = new URL(`https://gitee.com/api/v5${endpoint}`);
  url.searchParams.append("access_token", token);

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "content-type": "application/json",
    },
  });

  const rateLimit = res.headers.get("x-ratelimit-remaining");

  if (rateLimit && Number(rateLimit) < 1000) {
    sendDiscordMessage(`Rate limit remaining: ${rateLimit}`);
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gitee API error: ${res.status} - ${errorText}`);
  }

  return res.json();
};

export const statsEndPoint = async (request: Request, response: Response) => {
  if (request.method === "OPTIONS") {
    return response.end();
  }

  try {
    const { username, refreshCache } = StatsRequest.parse(request.body);

    await getStatsFromGiteeOrCache({
      username,
      token: getRandomGiteeToken(),
      refreshCache,
    });

    if (refreshCache) {
      const resetCount = await getResetAttempts(username);
      if (resetCount > 3) {
        throw new Error("Only three reset attempts possible");
      }

      await registerResetAttempt(username);
      await clearRendersForUsername({ username });
      await clearOgImagesForUsername({ username });
      await clearIgStoriesForUsername({ username });
    }

    return response.json({});
  } catch (err) {
    response.json({ error: (err as Error).message });
  }
};
