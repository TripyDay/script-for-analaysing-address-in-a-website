const XLSX = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');
const nlp = require('compromise');

function parseAddress(data) { 
  const dataArray = data.split(' ');
  let location = [];
  const city = dataArray[dataArray.length - 3] === 'CITY' ? `${dataArray[dataArray.length - 4]} ${dataArray[dataArray.length - 3]}` : dataArray[dataArray.length - 3]
  const state = dataArray[dataArray.length - 2];
  const zip = dataArray[dataArray.length - 1];

  for (let i=0; i < dataArray.length - 3;i++){
    if(dataArray[i+1] !== 'CITY'){
    location.push(dataArray[i])
    }
}
  const street = location.join(' ');
  console.log(street)
  return [street, city, state, zip];
}
axios.get('https://salesweb.civilview.com/Sales/SalesSearch?countyId=10')
  .then(async response => {
    const data = response.data;
    const $ = cheerio.load(data);

    const headers = [];
    const rows = [];

    const table = $('table.table-striped');

    table.find('thead tr').each((i, el) => {
      $(el).find('th').each((j, th) => {
        headers.push($(th).text());
      });
    });

    table.find('tbody tr').each((i, el) => {
      const row = [];
      $(el).find('td').each((j, td) => {
        row.push($(td).text());
      });
      rows.push(row);
    });

    const defendantIndex = headers.findIndex(header => header === 'Defendant');
    const addressIndex = headers.findIndex(header => header === 'Address');

    const filteredRows = rows.map(row => {
      const address = row[addressIndex];


      const [street, city, state, zip] = parseAddress(address);

      let defendant = row[defendantIndex];
      defendant = defendant.split(';')[0].trim();

      return [defendant, street, city, state, zip];
    });

    // Output data in desired format
    let output = 'Defendant\tStreet\tCity\tState\tZip\n'; // headers
    for (let i = 0; i < filteredRows.length; i++) {
      const [defendant, street, city, state, zip] = filteredRows[i];
      output += `${defendant}\t${street}\t${city}\t${state}\t${zip}\n`;
    }

    const workbook = XLSX.utils.book_new();
    const filteredHeaders = ["Defendant", "Street", "City", "State", "Zip"];
    const worksheet = XLSX.utils.aoa_to_sheet([filteredHeaders, ...filteredRows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'Defendant_Adress.xlsx');

    console.log('Defendants_Address10.xlsx created!');
  })
  .catch(error => {
})
