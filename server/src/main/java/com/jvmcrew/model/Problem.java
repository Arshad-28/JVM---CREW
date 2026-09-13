package com.jvmcrew.model;

import com.jvmcrew.model.enums.ProblemDifficulty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "problems")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String platform; // e.g. "LeetCode", "HackerRank", "Codeforces"

    @Column(nullable = false)
    private String topic; // e.g. "Arrays", "Strings", "Linked List", "Trees", "Graphs", "DP", "Stack", "Queue"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProblemDifficulty difficulty;
}
