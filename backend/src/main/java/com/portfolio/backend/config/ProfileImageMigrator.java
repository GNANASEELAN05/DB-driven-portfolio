package com.portfolio.backend.config;

import com.portfolio.backend.repository.ProfileImageRepository;
import com.portfolio.backend.model.ProfileImage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;


@Component
public class ProfileImageMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProfileImageMigrator.class);

    @Autowired
    private ProfileImageRepository profileImageRepository;

    @Override
    public void run(ApplicationArguments args) {
        try {
            migrateExistingImages();
        } catch (Exception e) {
            // Non-fatal — log and continue startup
            log.warn("ProfileImageMigrator: could not run migration — {}", e.getMessage());
        }
    }

    private void migrateExistingImages() {
        // Find all images where is_primary is false but there's no primary set for that type
        // This handles the case where old rows existed before we added is_primary column
        // (Hibernate sets them to false=default, so we promote the oldest row per type)

        List<String> types = List.of("original", "animated");

        for (String type : types) {
            List<ProfileImage> imgs = profileImageRepository
                    .findByImageTypeOrderByUploadedAtDesc(type);

            if (imgs.isEmpty()) continue;

            boolean anyPrimary = imgs.stream().anyMatch(ProfileImage::isPrimary);

            if (!anyPrimary) {
                // No primary set — promote the most recent one
                ProfileImage toPromote = imgs.get(0);
                toPromote.setPrimary(true);
                profileImageRepository.save(toPromote);
                log.info("ProfileImageMigrator: set image id={} as primary for type={}",
                        toPromote.getId(), type);
            }
        }
    }
}