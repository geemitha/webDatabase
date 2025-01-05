document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("data-form");
    const bulkUploadForm = document.getElementById("bulk-upload-form");
    const tableBody = document.getElementById("table-body");

    let rowIndex = 1;

    // Fetch and render existing data
    fetch("/data")
        .then((res) => res.json())
        .then((data) => {
            data.forEach((row) => addRowToTable(row));
        });

    // Handle form submission
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        const issn = formData.get("issn");
        if (!isValidISSN(issn)) {
            alert("Invalid ISSN. Please ensure it has exactly 8 characters excluding dashes.");
            return;
        }

        const entry = {
            title: formData.get("title"),
            issn: formatISSN(issn),
            publisher: formData.get("publisher"),
            ranking: formData.get("ranking"),
            discipline: formData.get("discipline"),
            journalHome: formData.get("journalHome"),
        };

        fetch("/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
        }).then(() => {
            addRowToTable(entry);
            form.reset();
        });
    });

    // Handle bulk upload form submission
    bulkUploadForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const csvFile = document.getElementById("csvFile").files[0];

        if (!csvFile) return alert("Please select a CSV file!");

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvData = e.target.result;
            const rows = csvData.split("\n").slice(1); // Skip header row
            const entries = rows
                .map((row) => {
                    const [title, issn, publisher, ranking, discipline, journalHome] = row.split(",");
                    const formattedISSN = formatISSN(issn ? issn.trim() : "");
                    if (!title || !isValidISSN(issn) || !publisher || !ranking || !discipline || !journalHome) return null;
                    return { title, issn: formattedISSN, publisher, ranking, discipline, journalHome };
                })
                .filter(Boolean);

            fetch("/bulk-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(entries),
            }).then(() => {
                entries.forEach((entry) => addRowToTable(entry));
                bulkUploadForm.reset();
            });
        };

        reader.readAsText(csvFile);
    });

    function addRowToTable(row) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${rowIndex++}</td>
            <td>${row.title}</td>
            <td>${row.issn}</td>
            <td>${row.publisher}</td>
            <td>${row.ranking}</td>
            <td>${row.discipline}</td>
            <td><a href="${row.journalHome}" target="_blank">${row.journalHome}</a></td>
            <td>
                <button class="edit-button">Edit</button>
                <button class="save-button" disabled>Save</button>
                <button class="delete-button">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);

        const editButton = tr.querySelector(".edit-button");
        const saveButton = tr.querySelector(".save-button");
        const deleteButton = tr.querySelector(".delete-button");

        editButton.addEventListener("click", () => toggleEditRow(tr));
        saveButton.addEventListener("click", () => toggleSaveRow(tr));
        deleteButton.addEventListener("click", () => deleteRow(tr));
    }

    function toggleEditRow(row) {
        const cells = row.querySelectorAll("td:not(:last-child)");
        cells.forEach((cell, index) => {
            if (index > 0 && index < cells.length - 1) {
                const value = cell.textContent;
                cell.innerHTML = `<input type="text" value="${value}" />`;
            }
        });
        row.querySelector(".edit-button").disabled = true;
        row.querySelector(".save-button").disabled = false;
    }

    function toggleSaveRow(row) {
        const inputs = row.querySelectorAll("input");
        inputs.forEach((input, index) => {
            row.cells[index + 1].textContent = input.value;
        });
        row.querySelector(".edit-button").disabled = false;
        row.querySelector(".save-button").disabled = true;
    }

    function deleteRow(row) {
        row.remove();
    }

    // Helper function to format ISSN numbers
    function formatISSN(issn) {
        const cleaned = issn.replace(/[^0-9X]/gi, "");
        if (cleaned.length <= 4) {
            return cleaned;
        } else if (cleaned.length <= 8) {
            return cleaned.slice(0, 4) + "-" + cleaned.slice(4);
        } else {
            return cleaned.slice(0, 4) + "-" + cleaned.slice(4, 8);
        }
    }

    // Helper function to validate ISSN
    function isValidISSN(issn) {
        const cleaned = issn.replace(/[^0-9X]/gi, "");
        return cleaned.length === 8;
    }
});
