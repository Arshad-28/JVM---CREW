package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportMethodologyDto {
    private String databaseEngine; // "PostgreSQL (Supabase/Local)"
    private String reportingSystem; // "EngineerSpace Performance Intelligence Engine"
    private String statementOfFact; // "All metrics derived exclusively from persistent PostgreSQL transaction tables."

    @Builder.Default
    private List<String> dataSources = new ArrayList<>();

    @Builder.Default
    private List<String> calculationRules = new ArrayList<>();
}
