const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const headers = ['Imię', 'Nazwisko'];
const rows = [
  ['Anna', 'Kowalska'],
  ['Jan', 'Kowalski'],
  ['Maria', 'Nowak'],
];

const data = [headers, ...rows];
const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Lista gości');

const outPath = path.join(__dirname, '..', 'public', 'szablon_lista_gosci.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Zapisano:', outPath);
