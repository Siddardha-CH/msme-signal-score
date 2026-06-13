package com.msme;

import com.msme.model.AppUser;
import com.msme.model.MsmeRecord;
import com.msme.repository.UserRepository;
import com.msme.repository.MsmeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class MsmeApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsmeApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(UserRepository userRepo, MsmeRepository msmeRepo, PasswordEncoder encoder) {
        return args -> {
            if (userRepo.count() == 0) {
                userRepo.save(new AppUser("admin", encoder.encode("admin123"), "admin"));
                userRepo.save(new AppUser("analyst", encoder.encode("analyst123"), "analyst"));
                userRepo.save(new AppUser("viewer", encoder.encode("viewer123"), "viewer"));
            }
            if (msmeRepo.count() == 0) {
                msmeRepo.save(createSample("27AABCU9603R1ZX", "TechSol Pvt Ltd", 2015, 9, 85, 72, 80, 120000, 2, true, 8, 5.2));
                msmeRepo.save(createSample("29AABCU9603R1ZX", "GreenFarm Exports", 2010, 7, 60, 55, 65, 85000, 5, true, 6, 3.1));
                msmeRepo.save(createSample("07AABCU9603R1ZX", "QuickServe Foods", 2019, 5, 45, 40, 30, 50000, 12, false, 3, 1.5));
            }
        };
    }

    private MsmeRecord createSample(String gstin, String name, int year, int gst, int utility,
                                    int upi, int digital, double balance, int bounceRate,
                                    boolean itr, int vintage, double revenueTrend) {
        MsmeRecord r = new MsmeRecord();
        r.setGstin(gstin);
        r.setBusinessName(name);
        r.setEstablishedYear(year);
        r.setGstCompliance(gst);
        r.setUtilityPaymentPunctuality(utility);
        r.setUpiTransactionFrequency(upi);
        r.setDigitalPresence(digital);
        r.setAvgMonthlyBalance(balance);
        r.setCheckBounceRate(bounceRate);
        r.setItrFiling(itr);
        r.setCreditBureauVintage(vintage);
        r.setMonthlyRevenueTrend(revenueTrend);
        return r;
    }
}
