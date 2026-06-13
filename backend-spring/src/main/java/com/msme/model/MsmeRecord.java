package com.msme.model;

import jakarta.persistence.*;

@Entity
@Table(name = "msme_records")
public class MsmeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String gstin;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "established_year")
    private int establishedYear;

    @Column(name = "gst_compliance")
    private int gstCompliance;

    @Column(name = "utility_payment_punctuality")
    private int utilityPaymentPunctuality;

    @Column(name = "upi_transaction_frequency")
    private int upiTransactionFrequency;

    @Column(name = "digital_presence")
    private int digitalPresence;

    @Column(name = "avg_monthly_balance")
    private double avgMonthlyBalance;

    @Column(name = "check_bounce_rate")
    private int checkBounceRate;

    @Column(name = "itr_filing")
    private boolean itrFiling;

    @Column(name = "credit_bureau_vintage")
    private int creditBureauVintage;

    @Column(name = "monthly_revenue_trend")
    private double monthlyRevenueTrend;

    public Long getId() { return id; }
    public String getGstin() { return gstin; }
    public void setGstin(String g) { this.gstin = g; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String n) { this.businessName = n; }
    public int getEstablishedYear() { return establishedYear; }
    public void setEstablishedYear(int y) { this.establishedYear = y; }
    public int getGstCompliance() { return gstCompliance; }
    public void setGstCompliance(int v) { this.gstCompliance = v; }
    public int getUtilityPaymentPunctuality() { return utilityPaymentPunctuality; }
    public void setUtilityPaymentPunctuality(int v) { this.utilityPaymentPunctuality = v; }
    public int getUpiTransactionFrequency() { return upiTransactionFrequency; }
    public void setUpiTransactionFrequency(int v) { this.upiTransactionFrequency = v; }
    public int getDigitalPresence() { return digitalPresence; }
    public void setDigitalPresence(int v) { this.digitalPresence = v; }
    public double getAvgMonthlyBalance() { return avgMonthlyBalance; }
    public void setAvgMonthlyBalance(double v) { this.avgMonthlyBalance = v; }
    public int getCheckBounceRate() { return checkBounceRate; }
    public void setCheckBounceRate(int v) { this.checkBounceRate = v; }
    public boolean isItrFiling() { return itrFiling; }
    public void setItrFiling(boolean v) { this.itrFiling = v; }
    public int getCreditBureauVintage() { return creditBureauVintage; }
    public void setCreditBureauVintage(int v) { this.creditBureauVintage = v; }
    public double getMonthlyRevenueTrend() { return monthlyRevenueTrend; }
    public void setMonthlyRevenueTrend(double v) { this.monthlyRevenueTrend = v; }
}
