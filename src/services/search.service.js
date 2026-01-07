const searchModel = require("../models/search.model");

class SearchService {
    buildConditions(params, segmentList, categoryList, bankList, loanTypeList, minVal, maxVal, colMap) {
        let conditions = "";
        let idx = params.length + 1;

        if (segmentList.length > 0) {
            if (colMap.segment) {
                conditions += ` AND ${colMap.segment} = ANY($${idx}::text[])`;
                params.push(segmentList);
                idx++;
            } else {
                conditions += ` AND 1=0`;
            }
        }

        if (categoryList.length > 0) {
            if (colMap.category) {
                conditions += ` AND ${colMap.category} = ANY($${idx}::text[])`;
                params.push(categoryList);
                idx++;
            } else {
                conditions += ` AND 1=0`;
            }
        }

        if (bankList.length > 0) {
            if (colMap.bank) {
                conditions += ` AND ${colMap.bank} = ANY($${idx}::text[])`;
                params.push(bankList);
                idx++;
            } else {
                conditions += ` AND 1=0`;
            }
        }

        if (loanTypeList.length > 0) {
            if (colMap.loanType) {
                conditions += ` AND ${colMap.loanType} = ANY($${idx}::text[])`;
                params.push(loanTypeList);
                idx++;
            } else {
                conditions += ` AND 1=0`;
            }
        }

        if (minVal !== null) {
            if (colMap.amount) {
                conditions += ` AND CAST(${colMap.amount} AS NUMERIC) >= $${idx}`;
                params.push(minVal);
                idx++;
            } else {
                if (minVal > 0) conditions += ` AND 1=0`;
            }
        }

        if (maxVal !== null) {
            if (colMap.amount) {
                conditions += ` AND CAST(${colMap.amount} AS NUMERIC) <= $${idx}`;
                params.push(maxVal);
                idx++;
            } else {
                conditions += ` AND 1=0`;
            }
        }

        return conditions;
    }

    async searchAll(query) {
        const { search, segments, categories, banks, loanTypes, minAmount, maxAmount } = query;
        const searchTerm = `%${search || ""}%`;
        const parseArray = (val) => (val ? val.split(",") : []);

        const segmentList = parseArray(segments);
        const categoryList = parseArray(categories);
        const bankList = parseArray(banks);
        const loanTypeList = parseArray(loanTypes);
        const minVal = minAmount ? Number(minAmount) : null;
        const maxVal = maxAmount ? Number(maxAmount) : null;

        // Search 1: loanregisterdetails
        let t1 = [];
        if (!segmentList.length && !categoryList.length && !bankList.length && !loanTypeList.length && minVal === null && maxVal === null) {
            t1 = await searchModel.searchLoanRegister(searchTerm);
        }

        // Search 2: leadtrackdetails
        const params2 = [searchTerm];
        const conditions2 = this.buildConditions(params2, segmentList, categoryList, bankList, loanTypeList, minVal, maxVal, { segment: 'custsegment', category: 'compcat', bank: 'bankname', loanType: 'loantype', amount: null });
        const t2 = await searchModel.searchLeadTrack(searchTerm, conditions2, params2);

        // Search 3: customers
        const params3 = [searchTerm];
        const conditions3 = this.buildConditions(params3, segmentList, categoryList, bankList, loanTypeList, minVal, maxVal, { segment: null, category: null, bank: 'bank', loanType: 'product', amount: 'disbursedvalue' });
        const t3 = await searchModel.searchCustomers(searchTerm, conditions3, params3);

        return [...t1, ...t2, ...t3];
    }
}

module.exports = new SearchService();
