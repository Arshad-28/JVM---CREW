package com.jvmcrew.model.enums;

import lombok.Getter;

@Getter
public enum MeetingPlatform {
    GOOGLE_MEET("Google Meet"),
    ZOOM("Zoom"),
    MS_TEAMS("Microsoft Teams"),
    OTHER("Other");

    private final String displayName;

    MeetingPlatform(String displayName) {
        this.displayName = displayName;
    }
}
