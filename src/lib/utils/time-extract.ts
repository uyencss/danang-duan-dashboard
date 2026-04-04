/**
 * Extracts week, month, quarter, and year from a given date.
 * Week calculation follows ISO-8601 standard or custom business logic.
 * Here we use simple Sunday-start week calculation for ease of use in reporting.
 */
export function extractTimeFields(date: Date | string) {
  const d = new Date(date);
  
  // Year
  const nam = d.getFullYear();
  
  // Month (1-12)
  const thang = d.getMonth() + 1;
  
  // Quarter (1-4)
  const quy = Math.ceil(thang / 3);
  
  // Week of Year
  // We'll use a simple calculation: day of year / 7
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diffInMs = d.getTime() - startOfYear.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const tuan = Math.ceil((diffInDays + startOfYear.getDay() + 1) / 7);

  return {
    tuan,
    thang,
    quy,
    nam
  };
}
