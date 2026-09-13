package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "learning_topics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subject; // e.g. "Java Core", "Spring Boot", "DSA", "System Design", "SQL"

    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false)
    private String title;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;
}
