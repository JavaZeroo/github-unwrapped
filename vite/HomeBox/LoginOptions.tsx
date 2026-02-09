import React, { useCallback, useState } from "react";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { SignInWithGitee } from "../SignInWithGitee";
import styles from "./styles.module.css";

type Props = {
  readonly userNotFound: boolean;
  readonly setUserNotFound: React.Dispatch<React.SetStateAction<boolean>>;
};

const getRandomUsername = () => {
  const usernames = ["gitee", "oschina", "openharmony", "mindspore"];
  return usernames[Math.floor(Math.random() * usernames.length)];
};

const removeWhitespace = (str: string) => str.replace(/\s/g, "");

export const LoginOptions: React.FC<Props> = ({
  userNotFound,
  setUserNotFound,
}) => {
  const [username, setUsername] = useState<string>("");

  const placeholderUsername = getRandomUsername();

  const placeholderString =
    window.innerWidth > 640
      ? `Your Gitee Username (e.g. ${placeholderUsername})`
      : "Your Gitee Username";

  const handleClick: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const cleanedUsername = removeWhitespace(username);
      fetch(`https://gitee.com/api/v5/users/${cleanedUsername}`)
        .then((response) => {
          if (!response.ok) {
            setUserNotFound(true);

            return null;
          }

          return response.json();
        })
        .then((result) => {
          if (!result || result.message) {
            setUserNotFound(true);
          } else {
            setUserNotFound(false);
            window.location.href = `/loading/${cleanedUsername}`;
          }
        })
        .catch((error) => console.log("error", error));
    },
    [setUserNotFound, username],
  );

  return (
    <div className={styles.loginOptionsWrapper}>
      <form className={styles.buttonContainer} onSubmit={handleClick}>
        <Input
          text={username}
          placeHolder={placeholderString}
          setText={setUsername}
          invalid={userNotFound}
          className={styles.input}
        />
        <Button
          hoverEffect
          className={styles.desktopSubmitButton}
          type={"submit"}
        >
          Unwrap
        </Button>
      </form>
      <div className={styles.divider} />
      <div className={styles.privateContributions}>
        Want to include private activity?
        <SignInWithGitee />
      </div>
    </div>
  );
};
