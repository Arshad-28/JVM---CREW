package com.jvmcrew.repository;

import com.jvmcrew.model.Standup;
import com.jvmcrew.model.StandupPdf;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface StandupPdfRepository extends JpaRepository<StandupPdf, Long> {

    Optional<StandupPdf> findFirstByReportTypeAndStandupOrderByIdDesc(String reportType, Standup standup);

    Optional<StandupPdf> findFirstByReportTypeAndTeamAndReportDateOrderByIdDesc(String reportType, Team team, LocalDate reportDate);

    Optional<StandupPdf> findFirstByReportTypeAndUserAndReportDateOrderByIdDesc(String reportType, User user, LocalDate reportDate);
}

