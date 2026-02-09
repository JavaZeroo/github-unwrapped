import { frontendCredentials, makeRedirectUriFrontend } from "./env";

export const signInWithGiteeLink = (reset = false) => {
  const params = new URLSearchParams();
  params.append("redirect_uri", makeRedirectUriFrontend(reset));
  params.append("client_id", frontendCredentials().VITE_CLIENT_ID);
  params.append("response_type", "code");
  params.append("scope", "user_info projects pull_requests issues");

  const url = new URL("https://gitee.com/oauth/authorize");
  url.search = params.toString();

  return url.toString();
};
