import * as XLSX from "xlsx";

export function exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) return;
    
    // Create a new workbook and a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    // Generate buffer and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}
