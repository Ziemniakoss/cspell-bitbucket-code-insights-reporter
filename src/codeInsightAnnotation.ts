/**
 * Single Code Insight Annotation for Code Insight Report
 */
export interface CodeInsightAnnotation {
    path: string;
    line: number;
    summary: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    annotation_type: "VULNERABILITY" | "CODE_SMELL" | "BUG";
    details: string | null;
    external_id: string;
}
