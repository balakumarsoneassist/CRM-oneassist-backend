/**
 * Credit Decision Engine
 * - Total score: sum of weighted sections
 * - Section scoring: A/B/C converted to points by multipliers
 */

const CONFIG = {
    bucketMultiplier: { A: 1.0, B: 0.6, C: 0.2 },
    overall: {
        A_min: 70, // 70+
        B_min: 50  // 50..69.99
    }
};

function mustBeNumber(v, field) {
    if (typeof v !== "number" || Number.isNaN(v)) {
        throw new Error(`Field "${field}" must be a number`);
    }
    return v;
}

function normalizeBucket(b) {
    if (!b) throw new Error(`Missing bucket`);
    const x = String(b).trim().toUpperCase();
    if (!["A", "B", "C"].includes(x)) throw new Error(`Invalid bucket "${b}" (expected A/B/C)`);
    return x;
}

function bucketPoints(weight, bucket) {
    const b = normalizeBucket(bucket);
    return weight * (CONFIG.bucketMultiplier[b] ?? 0);
}

function bucketByRange(value, rules) {
    for (const r of rules) {
        if (r.test(value)) return r.bucket;
    }
    throw new Error(`No rule matched for value: ${value}`);
}

/**
 * SECTION RULES
 */

function ageBucket(age) {
    mustBeNumber(age, "age");
    return bucketByRange(age, [
        { test: (v) => v >= 21 && v <= 35, bucket: "A" },
        { test: (v) => v >= 36 && v <= 50, bucket: "B" },
        { test: (v) => v >= 51 && v <= 58, bucket: "C" }
    ]);
}

function natureOfJobBucket(jobType) {
    const x = String(jobType || "").toLowerCase();
    if (["contract", "caution"].includes(x)) return "C";
    if (["govt_g3g4", "govt"].includes(x)) return "B";
    if (["professional", "engineering", "software", "hardware", "manufacturing"].includes(x)) return "A";
    return "B";
}

function educationBucket(level) {
    const x = String(level || "").toLowerCase();
    if (["10th", "12th", "diploma", "10th_12th_diploma"].includes(x)) return "C";
    if (["graduate"].includes(x)) return "B";
    if (["postgrad", "postgraduate", "professional", "doctorate", "postgrad_prof_doctorate"].includes(x)) return "A";
    return "B";
}

function totalExperienceBucket(years) {
    mustBeNumber(years, "totalExperienceYears");
    if (years > 5) return "A";
    if (years >= 1 && years <= 5) return "B";
    return "C";
}

function currentCompanyExperienceBucket(years) {
    mustBeNumber(years, "currentCompanyExperienceYears");
    if (years > 2) return "A";
    if (years >= 1 && years <= 2) return "B";
    return "C";
}

function jobStabilityBucket(breakInService) {
    const x = String(breakInService || "").toLowerCase();
    if (x === "none") return "A";
    if (x === "last2years") return "B";
    if (x === "last6months") return "C";
    return "B";
}

function netSalaryBucket(netSalary) {
    mustBeNumber(netSalary, "income.netSalary");
    if (netSalary > 50000) return "A";
    if (netSalary >= 25000 && netSalary <= 50000) return "B";
    return "C";
}

function foirBucket(foirPercent) {
    mustBeNumber(foirPercent, "income.foirPercent");
    if (foirPercent < 40) return "A";
    if (foirPercent >= 40 && foirPercent <= 60) return "B";
    return "C";
}

function otherIncomeBucket(otherIncomeToNetSalaryRatio) {
    mustBeNumber(otherIncomeToNetSalaryRatio, "income.otherIncomePctOfNet");
    if (otherIncomeToNetSalaryRatio >= 100) return "A";
    if (otherIncomeToNetSalaryRatio >= 50) return "B";
    return "C";
}

function bonusBucket(bonusPctOfNet) {
    mustBeNumber(bonusPctOfNet, "income.bonusPctOfNet");
    if (bonusPctOfNet >= 300) return "A";
    if (bonusPctOfNet >= 150) return "B";
    return "C";
}

function sumAssetPoints(assets) {
    const a = assets || {};
    let score = 0;
    if (a.ownHouse) score += 2;
    if (a.car) score += 1;
    if (a.twoWheeler) score += 1;
    if (a.agri) score += 0.5;
    if (a.consumerDurables) score += 0.5;
    return score;
}

function sumLiabilityCount(liabilities) {
    const l = liabilities || {};
    let cnt = 0;
    if (l.homeLoan) cnt += 1;
    if (l.personalLoan) cnt += 1;
    if (l.creditCard) cnt += 1;
    if (l.vehicleLoan) cnt += 1;
    if (l.goldOrOtherLoans) cnt += 1;
    return cnt;
}

function sumInvestmentPoints(inv) {
    const i = inv || {};
    let score = 0;
    if (i.mutualFunds) score += 2;
    if (i.insurance) score += 1;
    if (i.sharesOrStocks) score += 1;
    if (i.chit) score += 0.5;
    if (i.businessCapital) score += 0.5;
    return score;
}

function pointsToBucket_ByThreshold(points) {
    if (points > 3) return "A";
    if (points >= 2 && points <= 3) return "B";
    return "C";
}

function countToBucket_Reverse(count) {
    if (count > 3) return "C";
    if (count >= 2 && count <= 3) return "B";
    return "A";
}

function cibilBucket(cibilScore) {
    mustBeNumber(cibilScore, "credit.cibilScore");
    if (cibilScore > 750) return "A";
    if (cibilScore >= 700 && cibilScore <= 750) return "B";
    return "C";
}

function liveLoansBucket(liveLoansCount) {
    mustBeNumber(liveLoansCount, "credit.liveLoansCount");
    if (liveLoansCount > 12) return "C";
    if (liveLoansCount >= 8 && liveLoansCount <= 12) return "B";
    return "A";
}

function enquiries30dBucket(enq30d) {
    mustBeNumber(enq30d, "credit.enquiriesLast30Days");
    if (enq30d < 2) return "A";
    if (enq30d >= 2 && enq30d <= 4) return "B";
    return "C";
}

function enquiries3mBucket(enq3m) {
    mustBeNumber(enq3m, "credit.enquiriesLast3Months");
    if (enq3m < 3) return "A";
    if (enq3m >= 3 && enq3m <= 6) return "B";
    return "C";
}

function recentLoans3mBucket(recentLoans3m) {
    mustBeNumber(recentLoans3m, "credit.recentLoansIn3Months");
    if (recentLoans3m === 0) return "A";
    if (recentLoans3m < 2) return "B";
    return "C";
}

function loanTrackDefaultsBucket(flags) {
    const f = flags || {};
    const negativeSignals = [
        !!f.closedAccountsDPD_last3yrs,
        !!f.activeLoanDPD_last1yr,
        !!f.settledWrittenOffSuitFiled_lt3yrs,
        (typeof f.creditCardUsagePct === "number" && f.creditCardUsagePct >= 70),
        (typeof f.unsecuredLoansCount === "number" && f.unsecuredLoansCount > 6)
    ].filter(Boolean).length;

    const mediumSignals = [
        !!f.closedAccountsDPD_gt3yrs,
        !!f.activeLoanDPD_last2yrs,
        !!f.settledWrittenOffSuitFiled_gt3yrs,
        (typeof f.creditCardUsagePct === "number" && f.creditCardUsagePct >= 30 && f.creditCardUsagePct < 70),
        (typeof f.unsecuredLoansCount === "number" && f.unsecuredLoansCount > 4 && f.unsecuredLoansCount <= 6)
    ].filter(Boolean).length;

    if (negativeSignals > 0) return "C";
    if (mediumSignals > 0) return "B";
    return "A";
}

function bankingBucket(avgBalPctOfMonthlySalary) {
    mustBeNumber(avgBalPctOfMonthlySalary, "banking.avgBalancePctOfSalary");
    if (avgBalPctOfMonthlySalary > 50) return "A";
    if (avgBalPctOfMonthlySalary >= 25) return "B";
    return "C";
}

function companyTypeBucket(companyType) {
    const x = String(companyType || "").toLowerCase();
    if (["public_ltd", "ltd", "pvt_ltd", "mnc", "govt"].includes(x)) return "A";
    if (["llp", "opc"].includes(x)) return "B";
    if (["partnership", "proprietorship"].includes(x)) return "C";
    return "B";
}

function companyVintageBucket(years) {
    mustBeNumber(years, "company.vintageYears");
    if (years > 5) return "A";
    if (years >= 3 && years <= 5) return "B";
    return "C";
}

function paidUpCapitalBucket(paidUpCapitalLakhs) {
    mustBeNumber(paidUpCapitalLakhs, "company.paidUpCapitalLakhs");
    if (paidUpCapitalLakhs > 10) return "A";
    if (paidUpCapitalLakhs >= 5 && paidUpCapitalLakhs <= 10) return "B";
    return "C";
}

function natureOfBusinessBucket(nature) {
    const x = String(nature || "").toLowerCase();
    if (["manufacturing", "it", "telecom", "hospitals", "logistics"].includes(x)) return "A";
    if (["service", "trading"].includes(x)) return "B";
    if (["manpower", "edutech"].includes(x)) return "C";
    return "B";
}

function endUseBucket(endUse) {
    const x = String(endUse || "").toLowerCase();
    if (x === "debt_consolidation") return "A";
    if (x === "top_up") return "B";
    if (x === "fresh_loan") return "C";
    return "B";
}

function dependantsBucket(count) {
    mustBeNumber(count, "family.dependants");
    if (count > 3) return "C";
    if (count >= 2 && count <= 3) return "B";
    return "A";
}

function spouseBucket(spouseType) {
    const x = String(spouseType || "").toLowerCase();
    if (x === "housewife") return "C";
    if (x === "salaried") return "A";
    if (["freelancer", "part_time_business"].includes(x)) return "B";
    return "B";
}

function parentsBucket(parentsStatus) {
    const x = String(parentsStatus || "").toLowerCase();
    if (x === "retired") return "C";
    if (x === "pensioner") return "B";
    if (x === "working") return "A";
    return "B";
}

function evaluateApplication(app) {
    if (!app || typeof app !== "object") throw new Error("Body must be a JSON object");

    const weights = {
        age: 5, natureOfJob: 5, education: 5, family: 5,
        totalExperience: 3, currentCompanyExperience: 5, jobStability: 2,
        income: 25, assets: 5, liabilities: 5, investments: 5,
        creditReport: 15, banking: 10, companyProfile: 5, endUse: 5
    };

    const b = {};
    b.age = ageBucket(app.age);
    b.natureOfJob = natureOfJobBucket(app.natureOfJob);
    b.education = educationBucket(app.education);
    b.dependants = dependantsBucket(app.family?.dependants ?? 0);
    b.spouse = spouseBucket(app.family?.spouse);
    b.parents = parentsBucket(app.family?.parents);
    b.totalExperience = totalExperienceBucket(app.totalExperienceYears);
    b.currentCompanyExperience = currentCompanyExperienceBucket(app.currentCompanyExperienceYears);
    b.jobStability = jobStabilityBucket(app.jobStability);
    b.netSalary = netSalaryBucket(app.income?.netSalary);
    b.foir = foirBucket(app.income?.foirPercent);
    b.otherIncome = otherIncomeBucket(app.income?.otherIncomePctOfNet ?? 0);
    b.bonus = bonusBucket(app.income?.bonusPctOfNet ?? 0);

    const assetPts = sumAssetPoints(app.assets);
    const invPts = sumInvestmentPoints(app.investments);
    const liabilityCount = sumLiabilityCount(app.liabilities);
    b.assets = pointsToBucket_ByThreshold(assetPts);
    b.investments = pointsToBucket_ByThreshold(invPts);
    b.liabilities = countToBucket_Reverse(liabilityCount);

    b.cibil = cibilBucket(app.credit?.cibilScore);
    b.liveLoans = liveLoansBucket(app.credit?.liveLoansCount);
    b.enq30d = enquiries30dBucket(app.credit?.enquiriesLast30Days ?? 0);
    b.enq3m = enquiries3mBucket(app.credit?.enquiriesLast3Months ?? 0);
    b.recentLoans3m = recentLoans3mBucket(app.credit?.recentLoansIn3Months ?? 0);
    b.loanTrackDefaults = loanTrackDefaultsBucket(app.credit?.loanTrackDefaults);
    b.banking = bankingBucket(app.banking?.avgBalancePctOfSalary);
    b.companyType = companyTypeBucket(app.company?.companyType);
    b.companyVintage = companyVintageBucket(app.company?.vintageYears);
    b.paidUpCapital = paidUpCapitalBucket(app.company?.paidUpCapitalLakhs);
    b.natureOfBusiness = natureOfBusinessBucket(app.company?.natureOfBusiness);
    b.endUse = endUseBucket(app.endUse);

    const breakdown = [];
    breakdown.push(scoreLine("Age", weights.age, b.age));
    breakdown.push(scoreLine("Nature of Job", weights.natureOfJob, b.natureOfJob));
    breakdown.push(scoreLine("Educational Qualification", weights.education, b.education));
    breakdown.push(scoreLine("Total Years of Experience", weights.totalExperience, b.totalExperience));
    breakdown.push(scoreLine("Current Company Experience", weights.currentCompanyExperience, b.currentCompanyExperience));
    breakdown.push(scoreLine("Job Stability", weights.jobStability, b.jobStability));
    breakdown.push(scoreLine("Family: Dependants", 2, b.dependants));
    breakdown.push(scoreLine("Family: Spouse", 2, b.spouse));
    breakdown.push(scoreLine("Family: Parents", 1, b.parents));
    breakdown.push(scoreLine("Income: Net Salary", 10, b.netSalary));
    breakdown.push(scoreLine("Income: FOIR", 10, b.foir));
    breakdown.push(scoreLine("Income: Other Income", 2.5, b.otherIncome));
    breakdown.push(scoreLine("Income: Bonus/Incentive", 2.5, b.bonus));
    breakdown.push(scoreLine("Assets", weights.assets, b.assets));
    breakdown.push(scoreLine("Liabilities", weights.liabilities, b.liabilities));
    breakdown.push(scoreLine("Investments", weights.investments, b.investments));

    const scale = 15 / 17;
    breakdown.push(scoreLine("Credit: CIBIL Score", 4 * scale, b.cibil));
    breakdown.push(scoreLine("Credit: Live Loans Count", 2 * scale, b.liveLoans));
    breakdown.push(scoreLine("Credit: Enquiries (30D)", 2 * scale, b.enq30d));
    breakdown.push(scoreLine("Credit: Enquiries (3M)", 2 * scale, b.enq3m));
    breakdown.push(scoreLine("Credit: Recent Loans (3M)", 2 * scale, b.recentLoans3m));
    breakdown.push(scoreLine("Credit: Loan Track & Defaults", 5 * scale, b.loanTrackDefaults));

    breakdown.push(scoreLine("Banking Details", weights.banking, b.banking));
    breakdown.push(scoreLine("Company: Type", 1, b.companyType));
    breakdown.push(scoreLine("Company: Vintage", 1, b.companyVintage));
    breakdown.push(scoreLine("Company: Paid-up Capital", 2, b.paidUpCapital));
    breakdown.push(scoreLine("Company: Nature of Business", 1, b.natureOfBusiness));
    breakdown.push(scoreLine("End Use", weights.endUse, b.endUse));

    const totalScore = round2(breakdown.reduce((s, x) => s + x.points, 0));
    const grade = totalScore >= CONFIG.overall.A_min ? "A" : totalScore >= CONFIG.overall.B_min ? "B" : "C";
    const lenderFocus = grade === "A" ? "Focus in Banks" : grade === "B" ? "Banks and NBFC" : "NBFC";

    return { totalScore, grade, lenderFocus, buckets: b, breakdown };
}

function scoreLine(name, weight, bucket) {
    const points = round2(bucketPoints(weight, bucket));
    return { name, weight: round2(weight), bucket: normalizeBucket(bucket), points };
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

module.exports = { evaluateApplication };
