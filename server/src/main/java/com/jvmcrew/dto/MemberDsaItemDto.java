package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDsaItemDto {
    private Long problemId;
    private String title;
    private String difficulty; // "EASY", "MEDIUM", "HARD"
    private String topic;
    private String status; // "SOLVED", "ATTEMPTED"
    private Instant solvedAt;
}
