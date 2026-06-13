package com.msme.repository;

import com.msme.model.MsmeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MsmeRepository extends JpaRepository<MsmeRecord, Long> {
    Optional<MsmeRecord> findByGstin(String gstin);
    boolean existsByGstin(String gstin);
}
