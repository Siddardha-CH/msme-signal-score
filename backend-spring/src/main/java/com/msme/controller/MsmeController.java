package com.msme.controller;

import com.msme.model.AppUser;
import com.msme.model.MsmeRecord;
import com.msme.repository.MsmeRepository;
import com.msme.service.ScoringService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/msme")
public class MsmeController {

    private final MsmeRepository msmeRepo;
    private final ScoringService scoringService;

    public MsmeController(MsmeRepository msmeRepo, ScoringService scoringService) {
        this.msmeRepo = msmeRepo;
        this.scoringService = scoringService;
    }

    @GetMapping
    public ResponseEntity<List<MsmeRecord>> getAll(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(msmeRepo.findAll());
    }

    @GetMapping("/{gstin}")
    public ResponseEntity<MsmeRecord> getByGstin(@PathVariable String gstin,
                                                  @AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(msmeRepo.findByGstin(gstin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MSME not found")));
    }

    @GetMapping("/score/{gstin}")
    public ResponseEntity<Map<String, Object>> getScore(@PathVariable String gstin,
                                                        @AuthenticationPrincipal AppUser user) {
        MsmeRecord record = msmeRepo.findByGstin(gstin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MSME not found"));
        return ResponseEntity.ok(scoringService.score(record));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MsmeRecord> create(@RequestBody MsmeRecord record,
                                             @AuthenticationPrincipal AppUser user) {
        if (msmeRepo.existsByGstin(record.getGstin())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GSTIN already exists");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(msmeRepo.save(record));
    }

    @PutMapping("/{gstin}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MsmeRecord> update(@PathVariable String gstin,
                                             @RequestBody MsmeRecord body,
                                             @AuthenticationPrincipal AppUser user) {
        MsmeRecord record = msmeRepo.findByGstin(gstin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MSME not found"));
        record.setBusinessName(body.getBusinessName());
        record.setEstablishedYear(body.getEstablishedYear());
        record.setGstCompliance(body.getGstCompliance());
        record.setUtilityPaymentPunctuality(body.getUtilityPaymentPunctuality());
        record.setUpiTransactionFrequency(body.getUpiTransactionFrequency());
        record.setDigitalPresence(body.getDigitalPresence());
        record.setAvgMonthlyBalance(body.getAvgMonthlyBalance());
        record.setCheckBounceRate(body.getCheckBounceRate());
        record.setItrFiling(body.isItrFiling());
        record.setCreditBureauVintage(body.getCreditBureauVintage());
        record.setMonthlyRevenueTrend(body.getMonthlyRevenueTrend());
        return ResponseEntity.ok(msmeRepo.save(record));
    }

    @DeleteMapping("/{gstin}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String gstin,
                                                      @AuthenticationPrincipal AppUser user) {
        MsmeRecord record = msmeRepo.findByGstin(gstin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MSME not found"));
        msmeRepo.delete(record);
        return ResponseEntity.ok(Map.of("message", "Record deleted"));
    }
}
