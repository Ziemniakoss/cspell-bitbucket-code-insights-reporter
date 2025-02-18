import type { CSpellReporter, Issue, RunResult } from "@cspell/cspell-types";
import { CodeInsightReport } from "./codeInsightReport";
import { CodeInsightAnnotation } from "./codeInsightAnnotation";
import { callBitbucketApiCurl, chunk, getRelativePath, runCommand } from "./utils";

const ENV_REPOSITORY_NAME = "BITBUCKET_REPO_FULL_NAME";
const ENV_COMMIT_HASH = "BITBUCKET_COMMIT";

const REPO_NAME = process.env[ENV_REPOSITORY_NAME];
const COMMIT = process.env[ENV_COMMIT_HASH];

const BATCH_SIZE_LIMIT = 100;
const REPORT_ID = "spell";

export function getReporter(settings: unknown, cliOptions?: unknown): Required<CSpellReporter> {
    const spellingIssues: Issue[] = [];
    return {
        issue: (issue) => {
            spellingIssues.push(issue);
        },
        debug: () => {},
        progress: () => {},
        error: () => {},
        info: () => {},
        // @ts-ignore
        result: async (result) => {
            return createCodeInsightsReport(result)
                .then(() => createAnnotations(spellingIssues))
                .catch((error) => {
                    console.error("Error occurred while trying create BB Code Insights", error);
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
        details: runResult.issues == 0 ? "No spelling issues found" : `${runResult.issues} spelling issues found`,
        external_id: null,
    };
    const endpoint = `/${REPO_NAME}/commit/${COMMIT}/reports/${REPORT_ID}`;
    return callBitbucketApiCurl(endpoint, "PUT", report).catch((error) => console.error("ERR", error));
}

async function createAnnotations(spellingIssues: Issue[]) {
    let index = 0;
    const annotations: CodeInsightAnnotation[] = spellingIssues.map((issue) => {
        const details =
            issue.suggestions != null ? `Consider using one of these: ` + issue.suggestions.join(",") : null;
        const message = `Unknown word: ${issue.text}`;
        return {
            severity: "HIGH",
            type: "CODE_SMELL",
            message,
            details,
            path: getRelativePath(issue.uri ?? ""),
            line: issue.line.offset,
            external_id: `cspell_${index++}`
        };
    });
    const annotationBatches = chunk(annotations, BATCH_SIZE_LIMIT);
    console.log(annotationBatches);
    const endpoint = `/${REPO_NAME}/commit/${COMMIT}/reports/${REPORT_ID}/annotations`;
    const promises = annotationBatches.map((batch) => {
        return callBitbucketApiCurl(endpoint, "POST", batch)
            .then((commandResult) => console.log(commandResult))
            .catch((error) => console.error("BB Code Insights Annotation creation problem", error));
    });
    return Promise.all(promises);
}
