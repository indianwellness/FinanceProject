import xlsx from 'xlsx';

const filePath = 'C:\\Users\\Nitro 5\\Downloads\\Final Project Report 25-04-23 - Email.xlsx';
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['FINAL REPORT'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (row && row.some(cell => cell !== undefined && String(cell).trim() !== '')) {
    const label = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();
    const colC = String(row[2] ?? '').trim();
    const colD = String(row[3] ?? '').trim();
    console.log(`[R${r + 1}] "${label}" | ColB(31 Mar 23): "${colB}" | ColC(31 Mar 24): "${colC}" | ColD(31 Mar 25): "${colD}"`);
  }
}
