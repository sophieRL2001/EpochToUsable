const fileInput = document.getElementById('csvFileInput');
const statusDiv = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');
let objectUrl = null; // To store the blob URL for cleanup

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    // Reset previous state
    statusDiv.textContent = '';
    statusDiv.className = '';
    downloadLink.style.display = 'none';
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl); // Clean up previous blob URL
        objectUrl = null;
    }

    const file = event.target.files[0];
    if (!file) {
        statusDiv.textContent = 'No file selected.';
        statusDiv.className = 'error';
        return;
    }

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        statusDiv.textContent = 'Error: Please select a .csv file.';
        statusDiv.className = 'error';
        // Clear the input value so the user can select the same file again if needed after an error
        fileInput.value = '';
        return;
    }

    statusDiv.textContent = `Processing "${file.name}"...`;
    statusDiv.className = 'processing';

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const csvContent = e.target.result;
            processCSV(csvContent, file.name);
        } catch (error) {
            console.error("Error during file processing:", error);
            statusDiv.textContent = `Error processing file: ${error.message}`;
            statusDiv.className = 'error';
            fileInput.value = ''; // Clear input
        }
    };

    reader.onerror = function() {
        statusDiv.textContent = 'Error reading file.';
        statusDiv.className = 'error';
        fileInput.value = ''; // Clear input
    };

    reader.readAsText(file);
}

function processCSV(csvContent, originalFilename) {
    const lines = csvContent.trim().split(/\r?\n/); // Split by newline, handling Windows/Unix endings

    if (lines.length < 2) {
        statusDiv.textContent = 'Error: CSV file must have at least a header and one data row.';
        statusDiv.className = 'error';
        fileInput.value = ''; // Clear input
        return;
    }

    // --- Basic CSV Header Parsing (assumes simple comma separation) ---
    const headerLine = lines[0].trim();
    // Simple split, doesn't handle commas in quotes robustly
    const headers = headerLine.split(',').map(h => h.trim());

    let timeColumnIndex = -1;
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase() === 'time') {
            timeColumnIndex = i;
            break;
        }
    }

    if (timeColumnIndex === -1) {
        statusDiv.textContent = 'Error: "time" column not found in the CSV header.';
        statusDiv.className = 'error';
        fileInput.value = ''; // Clear input
        return;
    }

    // --- Process Data Rows ---
    const processedLines = [];
    let conversionErrors = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Simple split, doesn't handle commas in quotes robustly
        const cells = line.split(',');

        // Basic check for consistent column count (optional but good)
        if (cells.length !== headers.length) {
            console.warn(`Skipping row ${i + 1}: Incorrect number of columns (${cells.length} instead of ${headers.length}). Line: "${line}"`);
            processedLines.push(line); // Keep original line if structure is wrong
            continue;
        }

        const epochValueStr = cells[timeColumnIndex]?.trim(); // Use optional chaining

        if (epochValueStr === undefined || epochValueStr === '') {
             console.warn(`Skipping conversion for row ${i + 1}: Empty value in 'time' column.`);
             processedLines.push(cells.join(',')); // Keep original line
             continue;
        }

        try {
            // --- Epoch Conversion (Assuming Nanoseconds) ---
            // Use BigInt for potentially large nanosecond values
            const epochNano = BigInt(epochValueStr);
            const epochMillis = Number(epochNano / BigInt(1000000)); // Convert nano to milli

            if (isNaN(epochMillis)) {
                 throw new Error(`Value "${epochValueStr}" is not a valid number.`);
            }

            const date = new Date(epochMillis);

            if (isNaN(date.getTime())) { // Check if Date object is valid
                throw new Error(`Could not create a valid date from millisecond value ${epochMillis}.`);
            }

            // --- Format Date ---
            const formattedTime = formatDate(date);

            // Replace the original value
            cells[timeColumnIndex] = formattedTime;
            processedLines.push(cells.join(','));

        } catch (error) {
            console.warn(`Skipping conversion for row ${i + 1}: Error converting value "${epochValueStr}". ${error.message}`);
            conversionErrors++;
            // Keep the original line if conversion fails
            processedLines.push(line);
        }
    }

    // --- Assemble New CSV ---
    const newCsvContent = [headerLine, ...processedLines].join('\n');

    // --- Prepare Download ---
    const blob = new Blob([newCsvContent], { type: 'text/csv;charset=utf-8;' });
    objectUrl = URL.createObjectURL(blob); // Store the URL

    downloadLink.href = objectUrl;
    const baseName = originalFilename.toLowerCase().endsWith('.csv') ? originalFilename.slice(0, -4) : originalFilename;
    downloadLink.download = `${baseName}_fixed.csv`; // Suggest a filename
    downloadLink.style.display = 'inline-block'; // Make it visible

    let finalMessage = `File processed successfully. ${lines.length - 1} data rows processed.`;
    if (conversionErrors > 0) {
        finalMessage += ` ${conversionErrors} row(s) had errors during time conversion (kept original value). Check console for details.`;
        statusDiv.className = 'warning'; // Or keep 'success' but add warning text
    } else {
         statusDiv.className = 'success';
    }
     statusDiv.textContent = finalMessage;


    // Optional: Clear file input after successful processing to allow re-upload of same file
    // fileInput.value = '';
}

// --- Helper Function to Format Date ---
function formatDate(date) {
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const mmm = String(date.getMilliseconds()).padStart(3, '0');

    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${mmm}`;
}