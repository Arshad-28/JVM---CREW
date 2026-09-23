package com.jvmcrew.service;

import com.jvmcrew.dto.report.ExecutiveSummaryDto;
import com.jvmcrew.dto.report.TeamPerformanceReportDto;
import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfWriter;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileOutputStream;

import static org.junit.jupiter.api.Assertions.assertTrue;

class TeamPerformanceReportPdfTest {

    @Test
    void testCoverPageGeneration() throws Exception {
        TeamPerformanceReportDto report = TeamPerformanceReportDto.builder()
                .teamName("JVM CREW")
                .teamCohort("Internship Cohort 2026")
                .periodLabel("September 2026")
                .generatedAt("Sep 22, 2026 · 03:27 PM UTC")
                .currentLeadName("Mohammed Arshad")
                .currentLeadSerialNumber("JVMCREW-001")
                .currentLeadEmail("arshad@example.com")
                .executiveSummary(ExecutiveSummaryDto.builder()
                        .totalActiveMembers(5)
                        .totalTasksAssigned(0)
                        .totalTasksCompleted(0)
                        .taskCompletionRatePct(0)
                        .totalStandupsExpected(80)
                        .totalStandupsSubmitted(8)
                        .standupComplianceRatePct(10)
                        .totalHomeworkAssigned(1)
                        .totalHomeworkSubmitted(0)
                        .homeworkSubmissionRatePct(0)
                        .executiveSummaryText("During September 2026, JVM CREW recorded 0 completed engineering tasks and 8 daily standups.")
                        .build())
                .build();

        File outputFile = new File("target/test-cover-page.pdf");
        outputFile.getParentFile().mkdirs();

        Document doc = new Document(PageSize.A4, 36f, 36f, 40f, 40f);
        try (FileOutputStream fos = new FileOutputStream(outputFile)) {
            PdfWriter.getInstance(doc, fos);
            doc.open();

            TeamPerformanceReportService service = new TeamPerformanceReportService(
                    null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
            );

            service.addCoverPage(doc, report);
            doc.close();
        }

        assertTrue(outputFile.exists());
        assertTrue(outputFile.length() > 0);
    }
}
