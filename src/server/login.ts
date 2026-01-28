import type { Request, Response } from "express";
import { z } from "zod";
import {
  backendCredentials,
  makeRedirectUriBackend,
} from "../helpers/domain.js";
import {
  clearFailedRendersForUsername,
  clearIgStoriesForUsername,
  clearOgImagesForUsername,
  clearRendersForUsername,
  insertProfileStats,
} from "./db.js";
import { getStatsFromGitee } from "./get-stats-from-gitee.js";

export const loginEndPoint = async (request: Request, response: Response) => {
  if (request.method === "OPTIONS") {
    return response.end();
  }

  const query = z
    .object({
      code: z.string(),
      reset: z.string(),
    })
    .or(
      z.object({
        error: z.string(),
        error_description: z.string(),
      }),
    )
    .parse(request.query);

  if ("error" in query) {
    if (query.error === "access_denied") {
      return response.redirect(`/about#permissions`);
    }

    throw new Error(query.error_description);
  }

  const { CLIENT_SECRET, VITE_CLIENT_ID } = backendCredentials();

  // Gitee OAuth token exchange
  const tokenUrl = new URL("https://gitee.com/oauth/token");
  const formdata = new URLSearchParams();
  formdata.append("grant_type", "authorization_code");
  formdata.append("client_id", VITE_CLIENT_ID);
  formdata.append("client_secret", CLIENT_SECRET);
  formdata.append("redirect_uri", makeRedirectUriBackend());
  formdata.append("code", query.code);

  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: "POST",
    body: formdata,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const tokenData = await tokenResponse.json();
  const access_token = tokenData.access_token;
  const error = tokenData.error;

  if (error) {
    throw new Error(
      `Error with code: (${request.originalUrl}) ${tokenData.error_description || error}`,
    );
  }

  if (!access_token) {
    throw new Error("No access token in response: " + JSON.stringify(tokenData));
  }

  const stats = await getStatsFromGitee({
    loggedInWithGitee: true,
    token: access_token,
    username: null,
  });

  if (!stats) {
    throw new Error("No stats");
  }

  if (query.reset === "true") {
    await clearRendersForUsername({ username: stats.username });
    await clearOgImagesForUsername({ username: stats.username });
    await clearIgStoriesForUsername({ username: stats.username });
  } else {
    await clearFailedRendersForUsername({ username: stats.username });
  }

  await insertProfileStats({
    type: "found",
    profile: stats,
    lowercasedUsername: stats.username.toLowerCase(),
  });

  return response.redirect(`/${stats.username}`);
};
