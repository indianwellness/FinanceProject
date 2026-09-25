import xlsx from 'xlsx';
import path from 'path';

const filePath = 'C:\\Users\\Nitro 5\\Downloads\\Final Project Report 25-04-23 - Email.xlsx';

const workbook = xlsx.readFile(filePath);
console.log('Sheets found:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const ref = sheet['!ref'];
  console.log(`\n--- Sheet: ${sheetName} (Range: ${ref}) ---`);
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
  console.log(`Total rows: ${data.length}`);
  // Print first 10 non-empty rows
  let printed = 0;
  for (let r = 0; r < data.length && printed < 15; r++) {
    const row = data[r];
    if (row && row.some(cell => cell !== undefined && cell !== '')) {
      console.log(`Row ${r + 1}:`, JSON.stringify(row.filter(c => c !== undefined && c !== '').slice(0, 8)));
      printed++;
    }
  }
});
