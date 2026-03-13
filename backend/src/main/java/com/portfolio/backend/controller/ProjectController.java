package com.portfolio.backend.controller;

import com.portfolio.backend.model.Project;
import com.portfolio.backend.repository.ProjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository repo;

    public ProjectController(ProjectRepository repo) {
        this.repo = repo;
    }

    // PUBLIC
    @GetMapping
    public List<Project> getAll() {
        return repo.findAllByOrderBySortOrderAscIdAsc();
    }

    // PUBLIC (Home uses featured)
    @GetMapping("/featured")
    public List<Project> featured() {
        return repo.findByFeaturedTrueOrderBySortOrderAscUpdatedAtDesc();
    }

    // ADMIN
    @PostMapping
    public Project add(@RequestBody Project p) {
        return repo.save(p);
    }

    // ADMIN
    @PutMapping("/{id}")
    public ResponseEntity<Project> update(@PathVariable Long id, @RequestBody Project req) {
        return repo.findById(id)
                .map(existing -> {
                    existing.setTitle(req.getTitle());
                    existing.setDescription(req.getDescription());
                    existing.setRepoUrl(req.getRepoUrl());
                    existing.setLiveUrl(req.getLiveUrl());
                    existing.setTech(req.getTech());
                    existing.setStatus(req.getStatus());
                    existing.setFeatured(req.getFeatured());
                    existing.setSortOrder(req.getSortOrder());
                    return ResponseEntity.ok(repo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ADMIN
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}