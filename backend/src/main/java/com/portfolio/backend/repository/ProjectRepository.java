package com.portfolio.backend.repository;

import com.portfolio.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Legacy — kept in case anything still references it
    List<Project> findByFeaturedTrueOrderByUpdatedAtDesc();

    @Query("SELECT p FROM Project p ORDER BY COALESCE(p.sortOrder, 9999) ASC, p.id ASC")
    List<Project> findAllByOrderBySortOrderAscIdAsc();

    @Query("SELECT p FROM Project p WHERE p.featured = true ORDER BY COALESCE(p.sortOrder, 9999) ASC, p.updatedAt DESC")
    List<Project> findByFeaturedTrueOrderBySortOrderAscUpdatedAtDesc();
}