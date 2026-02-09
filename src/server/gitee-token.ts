import { backendCredentials } from "../helpers/domain.js";

const TOKENS = 6;

let i = 0;

export const getRandomGiteeToken = (): string => {
  i++;
  const index = (i % TOKENS) + 1;
  if (index === 1) {
    return backendCredentials().GITEE_TOKEN_1;
  }

  if (index === 2) {
    return backendCredentials().GITEE_TOKEN_2;
  }

  if (index === 3) {
    return backendCredentials().GITEE_TOKEN_3;
  }

  if (index === 4) {
    return backendCredentials().GITEE_TOKEN_4;
  }

  if (index === 5) {
    return backendCredentials().GITEE_TOKEN_5;
  }

  if (index === 6) {
    return backendCredentials().GITEE_TOKEN_6;
  }

  throw new Error("Gitee token not found");
};
