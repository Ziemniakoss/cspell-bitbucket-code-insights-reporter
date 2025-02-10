import type { CSpellReporter, Issue, RunResult } from "@cspell/cspell-types";
import { spawn } from "child_process";

const API_URL = "http://api.bitbucket.org/2.0/repositories";
const ENV_REPOSITORY_NAME = "BITBUCKET_REPO_FULL_NAME";
const ENV_COMMIT_HASH = "BITBUCKET_COMMIT";
const BB_PROXY = "http://host.docker.internal:29418";

const REPO_NAME = process.env[ENV_REPOSITORY_NAME];
const COMMIT = process.env[ENV_COMMIT_HASH];

export function getReporter(
  settings: unknown,
  cliOptions?: unknown,
): Required<CSpellReporter> {
  const reportData = {};
  const spellingIssues: Issue[] = [];
  return {
    issue: (issue) => {
      spellingIssues.push(issue);
    },
    debug: () => {},
    progress: () => {},
    error: () => {},
    info: () => {},
    result: async (result) => {
      return createCodeInsightsReport(result)
        .then(() => createAnnotations(spellingIssues))
        .catch((error) => {
          console.error("Error occured:");
          console.error(error);
        });
    },
  };
}

async function createCodeInsightsReport(runResult: RunResult) {
  const report: CodeInsightReport = {
    result: runResult.issues > 0 ? "FAILED" : "PASSED",
    data: [],
    report_type: "BUG",
    title: "CSpell report",
    details:
      runResult.issues == 0
        ? "No spelling issues found"
        : `${runResult.issues} spelling issues found`,
    external_id: null,
  };
  const url = `${API_URL}/${REPO_NAME}/commit/${COMMIT}/reports/cspell`;
  return runCommand("curl", [
    "--proxy",
    BB_PROXY,
    "--request",
    "PUT",
    url,
    "--header",
    "Content-Type: application/json",
    "--data-raw",
    JSON.stringify(report),
  ]).then((data) => {
    console.log(data);
  });
}

async function createAnnotations(spellingIssues: Issue[]) {}

interface CodeInsightAnnotation {
  path: string;
  line: number;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  type: "VULNERABILITY" | "CODE_SMELL" | "BUG";
  details: string;
  external_id: string | null;
}

interface CodeInsightReport {
  title: string;
  details: string;
  external_id: string | null;
  report_type: "SECURITY" | "COVERAGE" | "TEST" | "BUG" | "UNKNOWN";
  result: "FAILED" | "PASSED" | "PENDING" | "UNKNOWN";
  data: any[];
}

async function runCommand(command: string, args: string[]) {
  const process = spawn(command, args);
  let stdOut = "";
  let stdErr = "";
  process.stdout.on("data", (data) => {
    stdOut += data.toString();
  });
  process.stderr.on("data", (data) => {
    stdErr += data.toString();
  });

  return new Promise((resolve, reject) => {
    process.on("exit", (code) => {
      const returnedData = { stdErr, stdOut, code };
      if (code == 0) {
        resolve(returnedData);
      } else {
        reject(returnedData);
      }
    });
  });
}
