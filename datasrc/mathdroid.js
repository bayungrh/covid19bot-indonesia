const unirest = require('unirest')

// const groupBy = (array, key, status) => {
//   return array.reduce((objectsByKeyValue, obj) => {
//     const value = obj[key];
//     if(status) {
//         if(obj['status'] == status) objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
//     } else { objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj); }
//     return objectsByKeyValue;
//     }, {});
// }

// const case_sumary__old = () => {
//     return unirest.get('https://indonesia-covid-19.mathdro.id/api/kasus').type('json').then(data => data.body.data.nodes).then(data => {
//         let group_provinsi = groupBy(data, 'klaster')
//         let group_wn = groupBy(data, 'wn')
//         let group_jk = groupBy(data, 'gender')
//         let daerah = [], warga_negara = [], jenis_kelamin = []
//         Object.keys(group_provinsi).forEach((e, i) => {
//             daerah.push({
//                 label: (e == "Indonesia" ? "TIdak diketahui" : e),
//                 value: group_provinsi[e].length
//             })
//         })
//         Object.keys(group_wn).forEach((e, i) => {
//             warga_negara.push({
//                 label: (e == "?" || e == 'null' ? "TIdak diketahui" : e),
//                 value: group_wn[e].length
//             })
//         })
//         Object.keys(group_jk).forEach((e, i) => {
//             jenis_kelamin.push({
//                 label: e,
//                 value: group_jk[e].length
//             })
//         })
//         return {
//             daerah: daerah,
//             warga_negara: warga_negara,
//             jenis_kelamin: jenis_kelamin
//         }
//     }).catch(err => {})
// };

const dataProvince = () => {
    return unirest.get('https://indonesia-covid-19.mathdro.id/api/provinsi').type('json')
    .then(data => data.body.data).catch(err => [])
};

module.exports = dataProvince
