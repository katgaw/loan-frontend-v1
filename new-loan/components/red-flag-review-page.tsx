"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  MinusCircle,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  X,
  XCircle,
  Download,
  Printer,
  FileDown,
} from "lucide-react";

interface RedFlagReviewPageProps {
  onBack: () => void;
}

type ResponseType = "Yes" | "No" | "N/A";

interface RedFlagQuestion {
  id: string;
  question: string;
  response: ResponseType;
  rationale: string;
  answer?: string;
  aiInsight: string;
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s_]/g, "");
}

function extractQuestionAnswerPairs(
  data: unknown,
  desiredKey: string
): Array<{ question: string; answer?: string }> | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const foundKey = Object.keys(record).find((k) => normalizeKey(k) === normalizeKey(desiredKey));
  if (!foundKey) return null;

  const section = record[foundKey];
  if (!section || typeof section !== "object") return null;

  const sectionRec = section as Record<string, unknown>;
  const q = sectionRec.question;
  const a = sectionRec.answer;
  if (!Array.isArray(q)) return null;

  const questions = q
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);

  const answers = Array.isArray(a)
    ? a
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .map((s) => s || undefined) // Convert empty strings to undefined
    : [];

  if (questions.length === 0) return null;
  return questions.map((question, idx) => ({
    question,
    answer: answers[idx], // Will be undefined if not present or empty
  }));
}

function makeQuestions(
  prefix: "L" | "FM",
  items: Array<{ question: string; answer?: string }>
): RedFlagQuestion[] {
  return items.map(({ question, answer }, idx) => ({
    id: `${prefix}${idx + 1}`,
    question,
    response: "N/A",
    rationale: "",
    answer,
    aiInsight: "",
  }));
}

// Lender Red Flags Review Questions
const lenderRedFlagsQuestions: RedFlagQuestion[] = [
  {
    id: "L1",
    question: "Does the lender's underwriting narrative adequately explain the property's income and expense assumptions?",
    response: "Yes",
    rationale: "The lender provided detailed explanations for all income assumptions including rental rates, vacancy factors, and other income sources. Expense ratios were benchmarked against comparable properties.",
    aiInsight: "Documentation appears comprehensive. Rental rate assumptions align with market data within 3% variance. Vacancy factor of 5% is conservative for this submarket.",
  },
  {
    id: "L2",
    question: "Are there any unexplained variances between the appraisal NOI and the lender's underwritten NOI?",
    response: "Yes",
    rationale: "All variances between appraisal and lender NOI have been documented and explained in the underwriting narrative with supporting market data.",
    aiInsight: "NOI variance of 4.2% is within acceptable range. Key drivers identified: management fee adjustment and insurance cost normalization.",
  },
  {
    id: "L3",
    question: "Does the lender's rent roll analysis support the projected rental income?",
    response: "Yes",
    rationale: "Rent roll analysis shows current occupancy of 87.5% with market-rate rents. Projected income aligns with current performance and market trends.",
    aiInsight: "Current rent levels are 2% below market, suggesting upside potential. Lease expiration schedule is well-distributed with no concentration risk.",
  },
  {
    id: "L4",
    question: "Are there any concerns with the property's expense ratio compared to market benchmarks?",
    response: "N/A",
    rationale: "Expense ratio of 42% is slightly above market average of 38%. Additional review of management fees and utility costs recommended.",
    aiInsight: "Elevated expense ratio driven by higher utility costs typical for properties of this vintage. Recommend monitoring utility expense trends.",
  },
  {
    id: "L5",
    question: "Has the lender adequately addressed any deferred maintenance or capital expenditure requirements?",
    response: "N/A",
    rationale: "Property is newly constructed (2022) with no identified deferred maintenance items. Standard reserves are in place per lender guidelines.",
    aiInsight: "New construction with minimal CapEx requirements. Reserve levels appropriate for property age and condition.",
  },
  {
    id: "L6",
    question: "Does the debt service coverage ratio meet the minimum requirements for this product type?",
    response: "Yes",
    rationale: "DSCR of 1.25x meets the typical threshold for conventional multifamily loans.",
    aiInsight: "DSCR provides adequate cushion for moderate stress scenarios. Sensitivity analysis suggests DSCR remains above 1.0x with 15% NOI decline.",
  },
];

// Fannie Mae Red Flags Review Questions
const fannieMaeRedFlagsQuestions: RedFlagQuestion[] = [
  {
    id: "FM1",
    question: "Does the property meet Fannie Mae's eligibility requirements for multifamily housing?",
    response: "Yes",
    rationale: "Property is a 248-unit multifamily complex meeting all Fannie Mae eligibility criteria including minimum unit count and property age requirements.",
    aiInsight: "All eligibility criteria verified. Property type, age, and unit count align with Fannie Mae guidelines for standard DUS execution.",
  },
  {
    id: "FM2",
    question: "Are there any Fannie Mae Guide compliance issues identified in the loan file?",
    response: "Yes",
    rationale: "Loan file documentation is complete and compliant with Fannie Mae Guide requirements. All required third-party reports are current.",
    aiInsight: "Documentation completeness score: 98%. Minor administrative items identified but no material compliance gaps.",
  },
  {
    id: "FM3",
    question: "Does the appraisal methodology comply with Fannie Mae standards?",
    response: "Yes",
    rationale: "Appraisal uses income approach as primary valuation method with appropriate cap rate selection and comparable sales analysis per Fannie Mae guidelines.",
    aiInsight: "Cap rate of 5.25% is consistent with recent comparable transactions. Income approach methodology follows Fannie Mae requirements.",
  },
  {
    id: "FM4",
    question: "Are there any environmental concerns or Phase I ESA findings requiring further review?",
    response: "N/A",
    rationale: "Phase I ESA indicates no recognized environmental conditions. No further environmental investigation required.",
    aiInsight: "Clean Phase I ESA with no RECs identified. Historical use review complete with no concerns.",
  },
  {
    id: "FM5",
    question: "Does the loan structure comply with Fannie Mae's credit enhancement requirements?",
    response: "Yes",
    rationale: "Credit enhancement structure meets Fannie Mae requirements with appropriate subordination levels and reserve accounts.",
    aiInsight: "Credit enhancement levels exceed minimum requirements by 15%. Reserve structure provides adequate liquidity coverage.",
  },
  {
    id: "FM6",
    question: "Has the borrower provided all required financial statements and certifications?",
    response: "Yes",
    rationale: "All borrower financial statements, certifications, and organizational documents have been received and reviewed.",
    aiInsight: "Borrower financials indicate strong liquidity position. Net worth requirement satisfied with 2.3x coverage.",
  },
  {
    id: "FM7",
    question: "Are there any market or submarket concerns that could impact loan performance?",
    response: "N/A",
    rationale: "Phoenix submarket showing increased supply with 3 competing properties under construction within 2-mile radius. Occupancy pressure possible.",
    aiInsight: "Submarket supply growth of 4.2% projected over 24 months. Demand fundamentals remain positive with 2.8% employment growth forecast.",
  },
];

// Question Card Component - matching loan-detail-page style
function QuestionCard({
  question,
  onResponseChange,
  onRationaleChange,
}: {
  question: RedFlagQuestion;
  onResponseChange: (id: string, response: ResponseType) => void;
  onRationaleChange: (id: string, rationale: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const responseIcon = question.response === "Yes" ? (
    <CheckCircle2 className="h-4 w-4 text-pass" />
  ) : question.response === "No" ? (
    <XCircle className="h-4 w-4 text-fail" />
  ) : (
    <MinusCircle className="h-4 w-4 text-muted-foreground" />
  );

  const responseColor = question.response === "Yes" 
    ? "text-pass" 
    : question.response === "No" 
      ? "text-fail" 
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors relative",
        question.response === "Yes"
          ? "border-border bg-card"
          : question.response === "No"
            ? "border-fail/30 bg-fail/5"
            : "border-muted bg-muted/30"
      )}
    >
      {/* Header Row */}
      <div className="flex w-full items-center justify-between gap-4 p-5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
            {question.id}
          </span>
          <h4 className="text-base font-medium text-foreground">{question.question}</h4>
        </button>
        <div className="flex items-center gap-4">
          {/* Response Display (Read-only) */}
          <div className={cn("flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5", responseColor)}>
            {responseIcon}
            <span className="text-sm font-medium">{question.response}</span>
          </div>
          {/* Comment Icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentOpen(!isCommentOpen);
            }}
            className={cn(
              "relative rounded-md p-1.5 transition-colors hover:bg-muted",
              commentText ? "text-accent" : "text-muted-foreground hover:text-foreground"
            )}
            title="Add comment"
          >
            <MessageSquare className="h-5 w-5" />
            {commentText && (
              <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
        </div>
      </div>

      {/* Comment Popup */}
      {isCommentOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-sm font-semibold text-foreground">Comment</h5>
            <button
              type="button"
              onClick={() => setIsCommentOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment here..."
            className="mb-3 min-h-[100px] resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommentOpen(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onRationaleChange(question.id, commentText);
                setIsCommentOpen(false);
              }}
            >
              Save Comment
            </Button>
          </div>
        </div>
      )}

      {/* Expanded Content - Answer and AI Insight */}
      {isExpanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {question.answer ? (
            <>
              <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-4 w-4 text-accent" />
                Answer
              </h5>
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-base leading-relaxed text-foreground">
                  {question.answer}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-muted/20 bg-muted/5 p-4">
              <p className="text-sm text-muted-foreground italic">
                No answer available for this question.
              </p>
            </div>
          )}

          {question.aiInsight ? (
            <>
              <h5 className={cn("flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground", question.answer ? "mt-4 mb-2" : "mb-2")}>
                <Sparkles className="h-4 w-4 text-accent" />
                AI Insight
              </h5>
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-base leading-relaxed text-foreground">
                  {question.aiInsight}
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function RedFlagReviewPage({ onBack }: RedFlagReviewPageProps) {
  const [activeTab, setActiveTab] = useState<"lender" | "fannieMae">("lender");
  const [lenderQuestions, setLenderQuestions] = useState<RedFlagQuestion[]>(lenderRedFlagsQuestions);
  const [fannieMaeQuestions, setFannieMaeQuestions] = useState<RedFlagQuestion[]>(fannieMaeRedFlagsQuestions);
  
  useEffect(() => {
    let isMounted = true;
    fetch("/api/test-json")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load test.json: ${r.status}`);
        return await r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const lenderFromJson = extractQuestionAnswerPairs(data, "Lender red flag");
        const companyFromJson = extractQuestionAnswerPairs(data, "Company red flag");
        if (lenderFromJson) setLenderQuestions(makeQuestions("L", lenderFromJson));
        if (companyFromJson) setFannieMaeQuestions(makeQuestions("FM", companyFromJson));
      })
      .catch(() => {
        // Keep hard-coded fallbacks
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentQuestions = activeTab === "lender" ? lenderQuestions : fannieMaeQuestions;

  const handleResponseChange = (id: string, response: ResponseType) => {
    const updatedQuestions = currentQuestions.map((q) =>
      q.id === id ? { ...q, response } : q
    );
    if (activeTab === "lender") {
      setLenderQuestions(updatedQuestions);
    } else {
      setFannieMaeQuestions(updatedQuestions);
    }
  };

  const handleRationaleChange = (id: string, rationale: string) => {
    const updatedQuestions = currentQuestions.map((q) =>
      q.id === id ? { ...q, rationale } : q
    );
    if (activeTab === "lender") {
      setLenderQuestions(updatedQuestions);
    } else {
      setFannieMaeQuestions(updatedQuestions);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Red Flag Review</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              Red flags review questions and compliance assessment
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent text-base">
            <Download className="h-5 w-5" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent text-base">
            <Printer className="h-5 w-5" />
            Print View
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("lender")}
          className={cn(
            "px-6 py-3 text-base font-medium transition-colors",
            activeTab === "lender"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Lender Red Flags Review
        </button>
        <button
          onClick={() => setActiveTab("fannieMae")}
          className={cn(
            "px-6 py-3 text-base font-medium transition-colors",
            activeTab === "fannieMae"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Fannie Mae Red Flags Review
        </button>
      </div>

      {/* Questions List - Card Style like loan-detail-page */}
      <div className="space-y-4">
        {currentQuestions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onResponseChange={handleResponseChange}
            onRationaleChange={handleRationaleChange}
          />
        ))}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="gap-2 bg-transparent text-base" size="lg">
          <FileDown className="h-5 w-5" />
          Export Comments to CSV
        </Button>
        <Button className="gap-2 text-base" size="lg">
          <Save className="h-5 w-5" />
          Save Comments
        </Button>
      </div>
    </div>
  );
}
