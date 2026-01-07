const ConnectorModel = require('../models/connector.model');
const axios = require("axios");

class ConnectorService {
    async createConnector(data) {
        const { name, mobilenumber, emailid, isactive, location, createdby } = data;
        const active = (isactive === true || isactive === 'true');
        const password = name.substring(0, 4) + mobilenumber.slice(-4);
        return await ConnectorModel.insertConnector([name, mobilenumber, emailid, password, active, location, createdby]);
    }

    async updateConnector(id, data) {
        const { name, mobilenumber, emailid, isactive, location, createdby } = data;
        const existing = await ConnectorModel.findById(id);
        if (!existing) return null;

        const updated = {
            name: name ?? existing.name,
            mobilenumber: mobilenumber ?? existing.mobilenumber,
            emailid: emailid ?? existing.emailid,
            isactive: typeof isactive !== 'undefined' ? isactive : existing.isactive,
            location: location ?? existing.location,
            createdby: createdby ?? existing.createdby
        };

        // Note: Parameterized query construction for update is cleaner in Service or Model? 
        // I put dynamic query building in Service here to keep Model simple "execute this query".
        const connector = await ConnectorModel.updateConnector(
            `UPDATE connector SET name = $1, mobilenumber = $2, emailid = $3, isactive = $4, location = $5, createdby = $6 WHERE id = $7 RETURNING *`,
            [updated.name, updated.mobilenumber, updated.emailid, updated.isactive, updated.location, updated.createdby, id]
        );

        if (!connector) return null;

        if (isactive === true || isactive === 'true') {
            try {
                await axios.post("http://localhost:5000/api/partners/webhook/connector-activated", { connectorId: connector.id, emailid: connector.emailid, name: connector.name, password: connector.password });
            } catch (e) { console.error("❌ Failed to send webhook:", e.message); }
        }
        return connector;
    }

    async getConnectorById(id) {
        return await ConnectorModel.findById(id);
    }

    async getConnectorList() {
        return await ConnectorModel.selectConnectorList();
    }

    async login(mobilenumber, password) {
        const connector = await ConnectorModel.findByMobileAndActive(mobilenumber);
        if (!connector) throw new Error('Invalid mobile number or password');
        if (password !== connector.password) throw new Error('Invalid mobile number or password');
        return connector;
    }

    async createConnectorContact(data) {
        const { firstname, mobilenumber, emailid, loantype, connectorid, organisationid, locationid, loanmount, istrack } = data;
        return await ConnectorModel.insertConnectorContact([firstname, mobilenumber, emailid, loantype, connectorid, organisationid, locationid, loanmount, istrack || false]);
    }
}

module.exports = new ConnectorService();
