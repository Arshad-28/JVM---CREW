package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateFollowUpRequest {
    private Long userId; // Member ID
    private String note;
    private LocalDate dueDate;
}
