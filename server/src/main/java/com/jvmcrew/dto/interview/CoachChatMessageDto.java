package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachChatMessageDto {
    private Long id;
    private String role; // USER or COACH
    private String content;
    private Instant createdAt;
}
