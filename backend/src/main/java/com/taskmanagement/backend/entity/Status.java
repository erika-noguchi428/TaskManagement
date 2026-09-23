package com.taskmanagement.backend.entity;

public enum Status {
    NOT_STARTED("未着手"),
    IN_PROGRESS("作業中"),
    DONE("完了");

    private final String label;

    Status(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static Status fromLabel(String label) {
        for (Status s : values()) {
            if (s.label.equals(label)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown status: " + label);
    }
}
