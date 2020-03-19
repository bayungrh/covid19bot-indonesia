const unirest = require('unirest')

const groupBy = (array, key, status) => {
  return array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    if(status) {
        if(obj['status'] == status) objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    } else { objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj); }
    return objectsByKeyValue;
    }, {});
}

const case_sumary = () => {
    return unirest.get('https://indonesia-covid-19.mathdro.id/api/kasus').type('json').then(data => {
        let group_provinsi = groupBy(data.body, 'provinsi')
        let group_wn = groupBy(data.body, 'wn')
        let group_jk = groupBy(data.body, 'jk')
        let daerah = [], warga_negara = [], jenis_kelamin = []
        Object.keys(group_provinsi).forEach((e, i) => {
            daerah.push({
                label: (e == "Indonesia" ? "TIdak diketahui" : e),
                value: group_provinsi[e].length
            })
        })
        Object.keys(group_wn).forEach((e, i) => {
            warga_negara.push({
                label: (e == "?" || e == 'null' ? "TIdak diketahui" : e),
                value: group_wn[e].length
            })
        })
        Object.keys(group_jk).forEach((e, i) => {
            let gender
            switch (e) {
                case "P": gender = "Perempuan"; break;
                case "L": gender = "Laki-laki"; break;
                default: gender = "Tidak diketahui"; break;
            }
            jenis_kelamin.push({
                label: gender,
                value: group_jk[e].length
            })
        })
        return {
            daerah: daerah,
            warga_negara: warga_negara,
            jenis_kelamin: jenis_kelamin
        }
    }).catch(err => {})
};

module.exports = case_sumary