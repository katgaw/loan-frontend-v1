"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRangePicker, type DateRange } from "@/components/date-range-picker";

export type { DateRange };

interface RiskAnalysisFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  riskScoreFilter: string;
  onRiskScoreChange: (value: string) => void;
  tlrStatusFilter: string;
  onTlrStatusChange: (value: string) => void;
  delegationFilter: string;
  onDelegationChange: (value: string) => void;
  lenderFilter: string;
  onLenderChange: (value: string) => void;
  acquisitionDateRange: DateRange;
  onAcquisitionDateRangeChange: (range: DateRange) => void;
  commitmentDateRange: DateRange;
  onCommitmentDateRangeChange: (range: DateRange) => void;
  underwriterFilter: string;
  onUnderwriterChange: (value: string) => void;
  originatorFilter: string;
  onOriginatorChange: (value: string) => void;
}

export function RiskAnalysisFilters({
  searchQuery,
  onSearchChange,
  riskScoreFilter,
  onRiskScoreChange,
  tlrStatusFilter,
  onTlrStatusChange,
  delegationFilter,
  onDelegationChange,
  lenderFilter,
  onLenderChange,
  acquisitionDateRange,
  onAcquisitionDateRangeChange,
  commitmentDateRange,
  onCommitmentDateRangeChange,
  underwriterFilter,
  onUnderwriterChange,
  originatorFilter,
  onOriginatorChange,
}: RiskAnalysisFiltersProps) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-card-foreground">
        Risk Analysis Filters
      </h2>
      <p className="mb-5 text-base text-muted-foreground">
        Filter and sort loans by various criteria
      </p>

      <div className="flex flex-col gap-4">
        {/* Search Input (always above other controls) */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by borrower, loan ID, or property..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-12 pl-11 text-base"
          />
        </div>

        {/* Row 1: Primary Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Risk Score Filter */}
          <Select value={riskScoreFilter} onValueChange={onRiskScoreChange}>
            <SelectTrigger className="h-8 w-[125px] text-xs">
              <SelectValue placeholder="Risk Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Risk Scores</SelectItem>
              <SelectItem value="1" className="text-xs">1</SelectItem>
              <SelectItem value="2" className="text-xs">2</SelectItem>
              <SelectItem value="3" className="text-xs">3</SelectItem>
              <SelectItem value="4" className="text-xs">4</SelectItem>
            </SelectContent>
          </Select>

          {/* TLR Status Filter */}
          <Select value={tlrStatusFilter} onValueChange={onTlrStatusChange}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="TLR Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All TLR Status</SelectItem>
              <SelectItem value="TLR Completed" className="text-xs">TLR Completed</SelectItem>
              <SelectItem value="TLR Not Completed" className="text-xs">TLR Not Completed</SelectItem>
              <SelectItem value="unknown" className="text-xs">Unknown</SelectItem>
            </SelectContent>
          </Select>

          {/* Credit Delegation Type Filter */}
          <Select value={delegationFilter} onValueChange={onDelegationChange}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Delegation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Delegation</SelectItem>
              <SelectItem value="Preview" className="text-xs">Preview</SelectItem>
              <SelectItem value="PD" className="text-xs">PD (Performance)</SelectItem>
              <SelectItem value="Standard" className="text-xs">Standard</SelectItem>
            </SelectContent>
          </Select>

          {/* Lender Filter */}
          <Select value={lenderFilter} onValueChange={onLenderChange}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Lenders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Lenders</SelectItem>
              <SelectItem value="Lender A" className="text-xs">Lender A</SelectItem>
              <SelectItem value="First National" className="text-xs">First National</SelectItem>
              <SelectItem value="Capital Bank" className="text-xs">Capital Bank</SelectItem>
            </SelectContent>
          </Select>

          {/* Underwriter Filter */}
          <Select value={underwriterFilter} onValueChange={onUnderwriterChange}>
            <SelectTrigger className="h-8 w-[135px] text-xs">
              <SelectValue placeholder="Underwriter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Underwriters</SelectItem>
              <SelectItem value="John Smith" className="text-xs">John Smith</SelectItem>
              <SelectItem value="Michael Chen" className="text-xs">Michael Chen</SelectItem>
              <SelectItem value="David Wilson" className="text-xs">David Wilson</SelectItem>
              <SelectItem value="Emily Davis" className="text-xs">Emily Davis</SelectItem>
              <SelectItem value="Jennifer Taylor" className="text-xs">Jennifer Taylor</SelectItem>
              <SelectItem value="Chris Thompson" className="text-xs">Chris Thompson</SelectItem>
            </SelectContent>
          </Select>

          {/* Originator Filter */}
          <Select value={originatorFilter} onValueChange={onOriginatorChange}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Originator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Originators</SelectItem>
              <SelectItem value="Sarah Johnson" className="text-xs">Sarah Johnson</SelectItem>
              <SelectItem value="Lisa Park" className="text-xs">Lisa Park</SelectItem>
              <SelectItem value="Amanda Brown" className="text-xs">Amanda Brown</SelectItem>
              <SelectItem value="Robert Martinez" className="text-xs">Robert Martinez</SelectItem>
              <SelectItem value="Kevin Anderson" className="text-xs">Kevin Anderson</SelectItem>
              <SelectItem value="Michelle Lee" className="text-xs">Michelle Lee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: Date Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Commitment Date Range Filter */}
          <DateRangePicker value={commitmentDateRange} onChange={onCommitmentDateRangeChange} label="Commitment Date" />

          {/* Acquisition Date Range Filter */}
          <DateRangePicker value={acquisitionDateRange} onChange={onAcquisitionDateRangeChange} label="Acquisition Date" />
        </div>
      </div>
    </div>
  );
}
