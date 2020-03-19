const unirest = require('unirest')

const kawalcovid19 = async () => {
    return unirest.get('https://kawalcovid19.harippe.id/api/summary').type('json').then(res => {
        let body = res.body
        if(res.headers['content-type'] === 'application/json') {
            return {
                country: "Indonesia 🇮🇩",
                infection: body.confirmed.value,
                recovered: body.recovered.value,
                deaths: body.deaths.value,
                active_cases: body.activeCare.value,
                lastUpdatedAt: body.metadata.lastUpdatedAt
            }
        } return {}
    }).catch(err => {})
};

module.exports = kawalcovid19