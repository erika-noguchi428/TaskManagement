package com.taskmanagement.backend.entity;

public enum Priority {
    HIGH("高", 1),
    MEDIUM("中", 2),
    LOW("低", 3);

    private final String label;
    private final int rank;

    Priority(String label, int rank) {
        this.label = label;
        this.rank = rank;
    }

    public String getLabel() {
        return label;
    }

    public int getRank() {
        return rank;
    }

    public static Priority fromLabel(String label) {
        for (Priority p : values()) {
            if (p.label.equals(label)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Unknown priority: " + label);
    }
}
