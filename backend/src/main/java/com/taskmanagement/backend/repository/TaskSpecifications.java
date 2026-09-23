package com.taskmanagement.backend.repository;

import com.taskmanagement.backend.entity.Priority;
import com.taskmanagement.backend.entity.Status;
import com.taskmanagement.backend.entity.Task;
import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    public static Specification<Task> hasStatus(Status status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Task> hasPriority(Priority priority) {
        return (root, query, cb) -> priority == null ? null : cb.equal(root.get("priority"), priority);
    }

    public static Specification<Task> keywordContains(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }

    /** Side-effect specification: sets ORDER BY via a CASE expression on priority rank (1=high). Predicate is always-true. */
    public static Specification<Task> orderByPriority(boolean ascending) {
        return (root, query, cb) -> {
            Expression<Integer> rank = cb.<Integer>selectCase()
                    .when(cb.equal(root.get("priority"), Priority.HIGH), Priority.HIGH.getRank())
                    .when(cb.equal(root.get("priority"), Priority.MEDIUM), Priority.MEDIUM.getRank())
                    .when(cb.equal(root.get("priority"), Priority.LOW), Priority.LOW.getRank())
                    .otherwise(Integer.MAX_VALUE);
            query.orderBy(ascending ? cb.asc(rank) : cb.desc(rank));
            return cb.conjunction();
        };
    }

    /** Side-effect specification: sets ORDER BY due_date. Predicate is always-true. */
    public static Specification<Task> orderByDueDate(boolean ascending) {
        return (root, query, cb) -> {
            query.orderBy(ascending ? cb.asc(root.get("dueDate")) : cb.desc(root.get("dueDate")));
            return cb.conjunction();
        };
    }
}
