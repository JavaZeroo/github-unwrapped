import buttonStyles from "./Button/styles.module.css";
import { signInWithGiteeLink } from "./sign-in-with-gitee";

export const SignInWithGitee: React.FC = () => {
  return (
    <a
      style={{ textDecoration: "none" }}
      className={buttonStyles.loginwithgitee}
      href={signInWithGiteeLink(true)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="1em"
        viewBox="0 0 1024 1024"
        style={{ marginRight: 8, verticalAlign: "middle", marginTop: -3 }}
      >
        <path
          fill="currentColor"
          d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-.007 63.206c0 13.971 11.322 25.293 25.292 25.293h177.024c13.97 0 25.293 11.322 25.293 25.293v12.646a75.88 75.88 0 0 1-75.88 75.88h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.88 75.88 0 0 1 75.854-75.88h353.946a25.293 25.293 0 0 0 25.267-25.292l.006-63.206a25.293 25.293 0 0 0-25.293-25.293H417.203a189.7 189.7 0 0 0-189.7 189.7v353.946c0 13.971 11.322 25.293 25.292 25.293h372.412a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"
        />
      </svg>
      Sign in with Gitee
    </a>
  );
};
