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

        <div className="flex flex-wrap items-center gap-4">
        {/* Risk Score Filter */}
        <Select value={riskScoreFilter} onValueChange={onRiskScoreChange}>
          <SelectTrigger className="h-12 w-[150px] text-base">
            <SelectValue placeholder="Risk Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">All Risk Scores</SelectItem>
            <SelectItem value="1" className="text-base">1</SelectItem>
            <SelectItem value="2" className="text-base">2</SelectItem>
            <SelectItem value="3" className="text-base">3</SelectItem>
            <SelectItem value="4" className="text-base">4</SelectItem>
          </SelectContent>
        </Select>

        {/* TLR Status Filter */}
        <Select value={tlrStatusFilter} onValueChange={onTlrStatusChange}>
          <SelectTrigger className="h-12 w-[180px] text-base">
            <SelectValue placeholder="TLR Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">All TLR Status</SelectItem>
            <SelectItem value="TLR Completed" className="text-base">TLR Completed</SelectItem>
            <SelectItem value="TLR Not Completed" className="text-base">TLR Not Completed</SelectItem>
            <SelectItem value="unknown" className="text-base">Unknown</SelectItem>
          </SelectContent>
        </Select>

        {/* Credit Delegation Type Filter */}
        <Select value={delegationFilter} onValueChange={onDelegationChange}>
          <SelectTrigger className="h-12 w-[180px] text-base">
            <SelectValue placeholder="Delegation Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">All Delegation</SelectItem>
            <SelectItem value="Preview" className="text-base">Preview</SelectItem>
            <SelectItem value="PD" className="text-base">PD (Performance)</SelectItem>
            <SelectItem value="Standard" className="text-base">Standard</SelectItem>
          </SelectContent>
        </Select>

        {/* Lender Filter */}
        <Select value={lenderFilter} onValueChange={onLenderChange}>
          <SelectTrigger className="h-12 w-[180px] text-base">
            <SelectValue placeholder="All Lenders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">All Lenders</SelectItem>
            <SelectItem value="Lender A" className="text-base">Lender A</SelectItem>
            <SelectItem value="First National" className="text-base">First National</SelectItem>
            <SelectItem value="Capital Bank" className="text-base">Capital Bank</SelectItem>
          </SelectContent>
        </Select>

        {/* Acquisition Date Range Filter */}
        <DateRangePicker value={acquisitionDateRange} onChange={onAcquisitionDateRangeChange} label="Acquisition Date" />

        {/* Commitment Date Range Filter */}
        <DateRangePicker value={commitmentDateRange} onChange={onCommitmentDateRangeChange} label="Commitment Date" />

        {/* Underwriter Filter */}
        <Select value={underwriterFilter} onValueChange={onUnderwriterChange}>
          <SelectTrigger className="h-12 w-[170px] text-base">
            <SelectValue placeholder="Underwriter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">All Underwriters</SelectItem>
            <SelectItem value="John Smith" className="text-base">John Smith</SelectItem>
            <SelectItem value="Michael Chen" className="text-base">Michael Chen</SelectItem>
            <SelectItem value="David Wilson" className="text-base">David Wilson</SelectItem>
            <SelectItem value="Emily Davis" className="text-base">Emily Davis</SelectItem>
            <SelectItem value="Jennifer Taylor" className="text-base">Jennifer Taylor</SelectItem>
            <SelectItem value="Chris Thompson" className="text-base">Chris Thompson</SelectItem>
          </SelectContent>
        </Select>

        {/* Originator Filter */}
        <Select value={originatorFilter} onValueChange={onOriginatorChange}>
          <SelectTrigger className="h-12 w-[170px] text-base">
            <SelectValue placeholder="Originator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">All Originators</SelectItem>
            <SelectItem value="Sarah Johnson" className="text-base">Sarah Johnson</SelectItem>
            <SelectItem value="Lisa Park" className="text-base">Lisa Park</SelectItem>
            <SelectItem value="Amanda Brown" className="text-base">Amanda Brown</SelectItem>
            <SelectItem value="Robert Martinez" className="text-base">Robert Martinez</SelectItem>
            <SelectItem value="Kevin Anderson" className="text-base">Kevin Anderson</SelectItem>
            <SelectItem value="Michelle Lee" className="text-base">Michelle Lee</SelectItem>
          </SelectContent>
        </Select>

        
        </div>
      </div>
    </div>
  );
}
