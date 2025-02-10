# Code insights integration for CSpell

## Usage

In your CI scripts that verify code using CSpell, add flag
```sh
 --reporter @ziemniakoss/cspell-bitbucket-code-insights-reporter
```

Resulting command could look like this

```sh
npx cspell . --reporter @ziemniakoss/cspell-bitbucket-code-insights-reporter
```

## Requirements

This reporter needs `curl` to be installed and in `PATH`.
This is required because Code Insights API can skip authorization in CI but only if we proxy requests through `http://host.docker.internal:29418` and proxy is not supported in node fetch API.