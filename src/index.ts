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
        report_type: "BUG",
        title: "CSpell report",
        details: runResult.issues == 0 ? "No spelling issues found" : `${runResult.issues} spelling issues found`,
        external_id: null,
        data: [
            {
                title: "Scanned files",
                value: runResult.files,
                type: "NUMBER",
            },
            {
                title: "Files with errors",
                value: runResult.filesWithIssues.size,
                type: "NUMBER",
            },
            {
                title: "Total issues count",
                value: runResult.issues,
                type: "NUMBER",
            },
            {
                title: "Total errors count",
                value: runResult.errors,
                type: "NUMBER",
            },
        ],
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
            annotation_type: "CODE_SMELL",
            summary: message,
            details,
            path: getRelativePath(issue.uri ?? ""),
            line: issue.row,
            external_id: `cspell_${index++}`,
        };
    });
    const annotationBatches = chunk(annotations, BATCH_SIZE_LIMIT);
    const endpoint = `/${REPO_NAME}/commit/${COMMIT}/reports/${REPORT_ID}/annotations`;
    const promises = annotationBatches.map((batch) => {
        return callBitbucketApiCurl(endpoint, "POST", batch)
            .catch((error) => console.error("BB Code Insights Annotation creation problem", error));
    });
    return Promise.all(promises);
}
