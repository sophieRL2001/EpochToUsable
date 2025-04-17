# CSV Epoch Time Converter

A simple web-based tool to convert epoch timestamps in a CSV file to a human-readable format.

## Features

1.  **Upload:** Allows users to upload a CSV file directly from their computer.
2.  **Convert:** Finds a column named "time" (case-insensitive) containing epoch timestamps (assumed to be in **nanoseconds**) and converts them to the format `YYYY-MM-DD HH:MM:SS.mmm`.
3.  **Download:** Lets users download the modified CSV file with the converted timestamps.

## Important Notes

*   **Column Name:** The script specifically looks for a header column named exactly `time` (case-insensitive).
*   **Epoch Format:** It assumes the epoch timestamps are in **nanoseconds** (e.g., `1744674946890266400`). If your timestamps are in seconds or milliseconds, the conversion logic in `script.js` needs to be adjusted.
*   **Client-Side:** All processing happens directly in your browser using JavaScript. No data is uploaded to any server.
*   **CSV Parsing:** Uses basic line and comma splitting. It might not handle complex CSV files with commas inside quoted fields correctly.
*   **Large Files:** Processing very large files might be slow or cause browser performance issues.

## Technology

*   HTML
*   Vanilla JavaScript (no external libraries)
*   CSS (for basic styling)
