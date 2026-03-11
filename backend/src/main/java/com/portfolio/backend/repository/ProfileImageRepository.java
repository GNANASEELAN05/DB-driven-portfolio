package com.portfolio.backend.repository;

import com.portfolio.backend.model.ProfileImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileImageRepository extends JpaRepository<ProfileImage, Long> {

    // Find the latest image by type ("original" or "animated")
    Optional<ProfileImage> findFirstByImageTypeOrderByUploadedAtDesc(String imageType);
}