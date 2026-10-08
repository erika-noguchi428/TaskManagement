package com.taskmanagement.backend.repository;

import com.taskmanagement.backend.entity.Status;
import com.taskmanagement.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    @Query("select coalesce(max(t.sortOrder), 0) from Task t where t.status = :status")
    int findMaxSortOrderByStatus(@Param("status") Status status);

    List<Task> findByStatusOrderBySortOrderAscIdAsc(Status status);
}
