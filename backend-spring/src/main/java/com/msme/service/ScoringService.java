package com.msme.service;

import com.msme.model.MsmeRecord;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ScoringService {

    private static final int CURRENT_YEAR = 2026;

    public Map<String, Object> score(MsmeRecord r) {
        double businessAge  = CURRENT_YEAR - r.getEstablishedYear();
        double ageScore     = Math.min(businessAge / 20.0 * 100, 100);
        double gstScore     = r.getGstCompliance();
        double utilScore    = r.getUtilityPaymentPunctuality();
        double upiScore     = Math.min(r.getUpiTransactionFrequency() / 10.0 * 100, 100);
        double digitalSc    = r.getDigitalPresence();
        double balScore     = Math.min(r.getAvgMonthlyBalance() / 200000.0 * 100, 100);
        double bounceScore  = Math.max(0, 100 - r.getCheckBounceRate() * 5.0);
        double itrScore     = r.isItrFiling() ? 100 : 0;
        double vintageScore = Math.min(r.getCreditBureauVintage() / 10.0 * 100, 100);
        double revenueScore = Math.min(r.getMonthlyRevenueTrend() / 10.0 * 100, 100);

        double[] weights = {0.10, 0.20, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10, 0.05, 0.10};
        double[] scores  = {ageScore, gstScore, utilScore, upiScore, digitalSc,
                             balScore, bounceScore, itrScore, vintageScore, revenueScore};

        double totalScore = 0;
        for (int i = 0; i < scores.length; i++) totalScore += scores[i] * weights[i];
        totalScore = Math.max(0, Math.min(100, totalScore));

        // Simulated prediction confidence (85–95)
        double confidence = 85 + (totalScore % 10);

        Map<String, Object> mlMeta = new LinkedHashMap<>();
        mlMeta.put("model_type", "WeightedSignalRegressor");
        mlMeta.put("prediction_confidence", Math.round(confidence * 10.0) / 10.0);
        mlMeta.put("version", "2.0");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "success");
        result.put("gstin", r.getGstin());
        result.put("business_name", r.getBusinessName());
        result.put("predicted_score", (int) Math.round(totalScore));
        result.put("grade", grade(totalScore));
        result.put("ml_metadata", mlMeta);
        result.put("factors", Map.of(
                "business_age", (int) Math.round(ageScore),
                "gst_compliance", (int) Math.round(gstScore),
                "utility_payment", (int) Math.round(utilScore),
                "upi_activity", (int) Math.round(upiScore),
                "digital_presence", (int) Math.round(digitalSc),
                "bank_balance", (int) Math.round(balScore),
                "check_bounce", (int) Math.round(bounceScore),
                "itr_filing", (int) Math.round(itrScore),
                "credit_vintage", (int) Math.round(vintageScore),
                "revenue_trend", (int) Math.round(revenueScore)
        ));
        return result;
    }

    private String grade(double score) {
        if (score >= 80) return "A";
        if (score >= 65) return "B";
        if (score >= 50) return "C";
        if (score >= 35) return "D";
        return "F";
    }
}
