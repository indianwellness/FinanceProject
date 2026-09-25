import xlsx from 'xlsx';

const filePath = 'C:\\Users\\Nitro 5\\Downloads\\Final Project Report 25-04-23 - Email.xlsx';
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['FINAL REPORT'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

console.log('=== FINAL REPORT ROWS 1 TO 125 ===');
for (let r = 0; r < Math.min(125, data.length); r++) {
  const row = data[r];
  if (row && row.some(cell => cell !== undefined && String(cell).trim() !== '')) {
    const label = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();
    const colC = String(row[2] ?? '').trim();
    const colD = String(row[3] ?? '').trim();
    const colE = String(row[4] ?? '').trim();
    const colF = String(row[5] ?? '').trim();
    console.log(`[R${r + 1}] "${label}" | B:"${colB}" | C:"${colC}" | D:"${colD}" | E:"${colE}" | F:"${colF}"`);
  }
}
