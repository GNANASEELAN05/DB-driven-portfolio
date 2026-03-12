package com.portfolio.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "profile_images")
public class ProfileImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_type", nullable = false, length = 255)
    private String imageType;

    @Column(name = "filename", length = 255)
    private String filename;

    @Column(name = "content_type", length = 255)
    private String contentType;

    // ✅ FIXED: Remove @Lob — it conflicts with PostgreSQL bytea
    // PostgreSQL bytea maps directly to byte[] without @Lob
    @Column(name = "data", columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "is_primary", columnDefinition = "boolean default false")
    private boolean primary = false;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public boolean isPrimary() { return primary; }
    public void setPrimary(boolean primary) { this.primary = primary; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}