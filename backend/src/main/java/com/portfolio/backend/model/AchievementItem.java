package com.portfolio.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "achievements")
public class AchievementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String issuer;
    private String year;

    @Column(length = 4000)
    private String description;

    private String link;

    // ===== Certificate file fields =====
    private String certificateFileName;
    private String certificateContentType;

    @Lob
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "certificate_data")
    private byte[] certificateData;

    // ===== GETTERS =====
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getIssuer() { return issuer; }
    public String getYear() { return year; }
    public String getDescription() { return description; }
    public String getLink() { return link; }
    public String getCertificateFileName() { return certificateFileName; }
    public String getCertificateContentType() { return certificateContentType; }
    public byte[] getCertificateData() { return certificateData; }

    // ===== SETTERS =====
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
    public void setYear(String year) { this.year = year; }
    public void setDescription(String description) { this.description = description; }
    public void setLink(String link) { this.link = link; }
    public void setCertificateFileName(String certificateFileName) { this.certificateFileName = certificateFileName; }
    public void setCertificateContentType(String certificateContentType) { this.certificateContentType = certificateContentType; }
    public void setCertificateData(byte[] certificateData) { this.certificateData = certificateData; }
}