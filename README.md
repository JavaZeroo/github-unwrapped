# Gitee Unwrapped

A platform that generates a year-in-review video for each Gitee user. Built with Vite 5, Remotion and AWS Lambda.

This project is adapted from [GitHub Unwrapped](https://github.com/remotion-dev/github-unwrapped) to work with Gitee instead.

## Setup

1. Run `npm i` to install dependencies.
2. Rename `.env.example` to `.env`
3. Set up your AWS account according to the [Remotion Lambda - Setup guide](https://remotion.dev/docs/lambda/setup). We use multiple accounts for load-balancing:
   - Use `AWS_KEY_1` instead of `REMOTION_AWS_ACCESS_KEY_ID` and `AWS_SECRET_1` instead of `REMOTION_AWS_SECRET_ACCESS_KEY`.
   - You can use `AWS_KEY_2` and `AWS_SECRET_2` to load-balance between two accounts, or paste the same credentials as before to use the same account.
   - In `src/helpers/set-env-for-key.ts`, we rotate the environment variables.
4. Deploy the functions into your AWS account(s):

   ```
   npx tsx deploy.ts
   ```

   Note that some AWS regions are disabled by default. [If you get an error, enable them or limit yourself to only default ones.](https://remotion.dev/docs/lambda/troubleshooting/security-token)

5. For caching the videos and Gitee API responses, set up a MongoDB (we use a free MongoDB Atlas Cloud instance) to save the videos. Set the connection string by filling out the values in `.env`.
6. For fetching data from Gitee, create a personal access token in your Gitee settings and set it as `GITEE_TOKEN_1`. Adding more tokens `GITEE_TOKEN_2` etc. will rotate the personal access tokens.
7. For OAuth login with Gitee, create a Gitee OAuth application and set `VITE_CLIENT_ID` and `CLIENT_SECRET` in your `.env` file.
8. Provide `DISCORD_CHANNEL` and `DISCORD_TOKEN` values to send monitoring logs to Discord.
9. Add a `SENTRY_DSN` environment variable to get error reports.

You now have all environment variables.

Run the web app:

```console
npm run dev
```

Edit the template in the Remotion Studio:

```console
npm run remotion
```

To deploy, connect your repository to [Render](https://render.com/). Don't forget to also set the environment variables there too.

## Scaling strategy

To allow thousands of people to render their video at the same time, we applied multiple strategies for scaling:

- Caching the video whenever possible. Before each render, a MongoDB database lock is created to avoid multiple renders for the same Gitee user to be accidentally created.
- Renders are distributed across an array of AWS regions and accounts to prevent hitting the [concurrency limit](https://www.remotion.dev/docs/lambda/troubleshooting/rate-limit).

## Credits

This project is based on [GitHub Unwrapped](https://github.com/remotion-dev/github-unwrapped) by [Remotion](https://www.remotion.dev) and [For One Red](https://github.com/foronered).

## Audio copyright disclaimer

The audio was licensed for GitHubUnwrapped.com from [SmartSound](https://www.smartsound.com/). If you create a derivative project, you must contact them for licensing.

## License

The code in this repository: Licensed under MIT.  
The Remotion framework (a dependency of this project): Companies need to obtain a paid license. Read the terms [here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md#company-license).
