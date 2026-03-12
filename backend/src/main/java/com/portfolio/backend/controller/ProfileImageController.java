package com.portfolio.backend.controller;

import com.portfolio.backend.model.ProfileImage;
import com.portfolio.backend.repository.ProfileImageRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile-image")
@CrossOrigin(origins = "*")
public class ProfileImageController {

    private final ProfileImageRepository repo;

    public ProfileImageController(ProfileImageRepository repo) {
        this.repo = repo;
    }

    // =========================================================
    // PUBLIC: Get image by type — /api/profile-image/view/original
    //                              /api/profile-image/view/animated
    // =========================================================
    @GetMapping("/view/{type}")
    public ResponseEntity<byte[]> getImageByType(@PathVariable String type) {
        if (!type.equals("original") && !type.equals("animated")) {
            return ResponseEntity.badRequest().build();
        }

        Optional<ProfileImage> imageOpt = repo.findFirstByImageTypeOrderByUploadedAtDesc(type);
        if (imageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ProfileImage img = imageOpt.get();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(img.getContentType()));
        headers.setContentDisposition(
            ContentDisposition.inline()
                .filename(img.getFilename() != null ? img.getFilename() : "image")
                .build()
        );
        // Prevent browser caching so updates show immediately
        headers.setCacheControl(CacheControl.noCache().mustRevalidate());
        return new ResponseEntity<>(img.getData(), headers, HttpStatus.OK);
    }

    // =========================================================
    // PUBLIC: List all images metadata — /api/profile-image/list
    // =========================================================
    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> listAll() {
        List<ProfileImage> all = repo.findAll();
        List<Map<String, Object>> result = all.stream().map(img -> Map.<String, Object>of(
            "id",          img.getId(),
            "imageType",   img.getImageType() != null ? img.getImageType() : "",
            "filename",    img.getFilename()  != null ? img.getFilename()  : "",
            "contentType", img.getContentType() != null ? img.getContentType() : "",
            "uploadedAt",  img.getUploadedAt()  != null ? img.getUploadedAt().toString() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    // =========================================================
    // ADMIN: Upload — /api/profile-image/upload/original
    //                  /api/profile-image/upload/animated
    // =========================================================
    @PostMapping(value = "/upload/{type}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @PathVariable String type,
            @RequestPart("file") MultipartFile file) {

        if (!type.equals("original") && !type.equals("animated")) {
            return ResponseEntity.badRequest().body("type must be 'original' or 'animated'");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
            (!contentType.startsWith("image/jpeg") &&
             !contentType.startsWith("image/jpg")  &&
             !contentType.startsWith("image/png")  &&
             !contentType.startsWith("image/gif")  &&
             !contentType.startsWith("image/webp"))) {
            return ResponseEntity.badRequest().body("Only JPEG, PNG, GIF, WebP allowed");
        }

        try {
            // Replace existing image of same type instead of accumulating
            repo.findFirstByImageTypeOrderByUploadedAtDesc(type)
                .ifPresent(existing -> repo.deleteById(existing.getId()));

            ProfileImage img = new ProfileImage();
            img.setImageType(type);
            img.setFilename(file.getOriginalFilename());
            img.setContentType(contentType);
            img.setData(file.getBytes());
            img.setUploadedAt(LocalDateTime.now());
            repo.save(img);
            return ResponseEntity.ok("Image uploaded successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    // =========================================================
    // ADMIN: Delete by ID — /api/profile-image/delete/{id}
    // =========================================================
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}