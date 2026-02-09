import React from "react";
import { GiteeIcon } from "../../icons/GiteeIcon";
import { RocketIcon } from "../../icons/RocketIcon";
import boxStyles from "../Box/styles.module.css";
import { HomeLink } from "../HomeLink";
import gradientStyles from "../styles.module.css";

export const HomeBoxTop: React.FC = () => {
  return (
    <div className={boxStyles.headerTopContainer}>
      <h2
        style={{ fontSize: 18, marginLeft: 7 }}
        className={gradientStyles.gradientText2}
      >
        #GiteeUnwrapped
      </h2>
      <div className={boxStyles.linkContainer}>
        <HomeLink
          href={"https://gitee.com/JavaZeroo/gitee-unwrapped"}
          label={"Source Code"}
          icon={(props) => <GiteeIcon {...props} />}
        />
        <HomeLink
          href={"/about"}
          label={"About this project"}
          icon={(props) => <RocketIcon {...props} />}
        />
      </div>
    </div>
  );
};
