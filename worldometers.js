const puppeteer = require("puppeteer");

const covid19_update = async (country_name) => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(true)
    await page.goto(`https://www.worldometers.info/coronavirus/`, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
    })

    const data = await page.evaluate(async(country_name) => {
        let affecteds = []
        let table_affected = document.querySelectorAll('#main_table_countries > tbody:nth-child(2) tr')
        table_affected.forEach(td => {
            let country = td.querySelector('td:nth-child(1)').textContent
            if(country.toLowerCase().includes(country_name)) {
                affecteds = {
                    country: country.trim() + " 🇮🇩",
                    infection: td.querySelector('td:nth-child(2)').textContent.trim(),
                    // new_cases: td.querySelector('td:nth-child(3)').textContent.trim(),
                    deaths: td.querySelector('td:nth-child(4)').textContent.trim(),
                    // new_deaths: td.querySelector('td:nth-child(5)').textContent.trim(),
                    recovered: td.querySelector('td:nth-child(6)').textContent.trim(),
                    active_cases: td.querySelector('td:nth-child(7)').textContent.trim(),
                }
            }
        })
        return affecteds
    }, country_name)
    await browser.close()
    return data
};

module.exports = covid19_update