/**
 * Single Code Insight Annotation for Code Insight Report
 */
export interface CodeInsightAnnotation {
    path: string;
    line: number;
    message: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    type: "VULNERABILITY" | "CODE_SMELL" | "BUG";
    details: string | null;
    external_id: string
}
