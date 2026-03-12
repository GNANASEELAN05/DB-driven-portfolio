// ProfileImageRepository.java
package com.portfolio.backend.repository;

import com.portfolio.backend.model.ProfileImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Optional;
 
@Repository
public interface ProfileImageRepository extends JpaRepository<ProfileImage, Long> {
 
    // All images of a given type (original / animated)
    List<ProfileImage> findByImageTypeOrderByUploadedAtDesc(String imageType);
 
    // The primary image of a given type
    Optional<ProfileImage> findByImageTypeAndPrimaryTrue(String imageType);
 
    // All images regardless of type
    List<ProfileImage> findAllByOrderByUploadedAtDesc();
 
    // Find by id and type (for safety checks)
    Optional<ProfileImage> findByIdAndImageType(Long id, String imageType);
}
 