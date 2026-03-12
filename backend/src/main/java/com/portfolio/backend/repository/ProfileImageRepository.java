// ProfileImageRepository.java
package com.portfolio.backend.repository;

import com.portfolio.backend.model.ProfileImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProfileImageRepository extends JpaRepository<ProfileImage, Long> {

    // Used by GET /{type} endpoint
    Optional<ProfileImage> findFirstByImageTypeOrderByUploadedAtDesc(String imageType);

    // Used by list endpoint
    List<ProfileImage> findAll();
}