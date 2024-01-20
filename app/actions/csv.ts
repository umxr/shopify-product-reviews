export const expectedHeaders = ["handle", "name", "message", "rating"];

export const validateCSVRow = (
  row: any,
  rowIndex: number,
  validationErrors: string[]
) => {
  console.log("row", row);
  let isValid = true;

  // Validate Handle (dash-separated format)
  const handleRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!row.handle || !handleRegex.test(row.handle)) {
    validationErrors.push(
      `Row ${rowIndex}: Invalid 'Handle' (should be dash-separated, received '${row.handle}').`
    );
    isValid = false;
  }

  // Validate Name
  if (!row.name || typeof row.name !== "string" || row.name.trim() === "") {
    validationErrors.push(`Row ${rowIndex}: 'Name' is missing or empty.`);
    isValid = false;
  }

  // Validate Message
  if (
    !row.message ||
    typeof row.message !== "string" ||
    row.message.length > 200
  ) {
    validationErrors.push(
      `Row ${rowIndex}: 'Message' is either missing or exceeds 200 characters.`
    );
    isValid = false;
  }

  // Validate Review
  const rating = parseInt(row.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    validationErrors.push(
      `Row ${rowIndex}: 'Rating' should be a number between 1 and 5 (received '${row.rating}').`
    );
    isValid = false;
  }

  return isValid;
};

export const parseAndValidateCSV = async (file: File) => {
  const text = await file.text();
  const rows = text.split("\n");
  let validationErrors: string[] = [];
  let isHeaderValid = true;

  // Check headers
  const headers = rows[0].split(",");
  const missingHeaders = expectedHeaders.filter(
    (header) => !headers.includes(header)
  );
  if (missingHeaders.length > 0) {
    validationErrors.push(`Missing headers: ${missingHeaders.join(", ")}`);
    isHeaderValid = false;
  } else {
    // Validate each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");
      const rowData = row.reduce((acc, current, index) => {
        acc[headers[index]] = current;
        return acc;
      }, {});

      const rowIsValid = validateCSVRow(rowData, i + 1, validationErrors);
      if (!rowIsValid) {
        console.log(`Row ${i + 1} is invalid.`);
      }
    }
  }

  if (!isHeaderValid || validationErrors.length > 0) {
    return {
      status: "error",
      error: "Validation errors in CSV file.",
      details: validationErrors,
    };
  }

  return {
    status: "success",
  };
};
