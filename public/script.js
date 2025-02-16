document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("data-form");
    const bulkUploadForm = document.getElementById("bulk-upload-form");
    const tableBody = document.getElementById("table-body");
    const messageContainer = document.getElementById("message-container");
    const filtersContainer = document.getElementById("filters-container");
    const plusButton = document.querySelector(".plus-button");
    const minusButton = document.querySelector(".minus-button");
    const searchButton = document.querySelector(".search-button");

    let rowIndex = 1;

    // Fetch and render existing data
    fetch("/data")
        .then((res) => res.json())
        .then((data) => {
            data.filter(row => row.isArchive === 'false').forEach((row) => addRowToTable(row));
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
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
        }).then((res) => res.json())
          .then((data) => {
            addRowToTable(data.data);
            form.reset();
        });
    });

    // Handle bulk upload form submission
    bulkUploadForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const csvFile = document.getElementById("csvFile").files[0];

        if (!csvFile) return alert("Please select a CSV file!");

        const formData = new FormData();
        formData.append("csvFile", csvFile);

        fetch("/bulk-data", {
            method: "POST",
            body: formData,
        }).then((res) => res.json())
          .then((res) => {
            console.log(res);
            if (res.success) {
                showMessage("Bulk upload successful!", "success");
                bulkUploadForm.reset();
                //refresh the page with 3 second delay
                setTimeout(() => window.location.reload(), 3000); 
                
            } else {
                showMessage(res.message || "Bulk upload failed!", "error");
            }
        }).catch((error) => {
            showMessage(error, "error");
        });
    });

    function addRowToTable(row) {
        const tr = document.createElement("tr");
        tr.dataset.id = row.id; // Store the id in a data attribute
        tr.innerHTML = `
            <td>${rowIndex++}</td>
            <td data-key="title">${row.title}</td>
            <td data-key="issn">${row.issn}</td>
            <td data-key="publisher">${row.publisher}</td>
            <td data-key="ranking">${row.ranking}</td>
            <td data-key="discipline">${row.discipline}</td>
            <td data-key="journalHome"><a href="${row.journalHome}" target="_blank">${row.journalHome}</a></td>
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
        const cells = row.querySelectorAll("td[data-key]");
        cells.forEach((cell) => {
            const value = cell.textContent;
            cell.innerHTML = `<input type="text" value="${value}" />`;
        });
        row.querySelector(".edit-button").disabled = true;
        row.querySelector(".save-button").disabled = false;
    }

    function toggleSaveRow(row) {
        const inputs = row.querySelectorAll("input");
        const updatedData = {};
        inputs.forEach((input, index) => {
            const key = row.cells[index + 1].getAttribute('data-key');
            updatedData[key] = input.value;
            row.cells[index + 1].innerHTML = key === "journalHome" ? `<a href="${input.value}" target="_blank">${input.value}</a>` : input.value;
        });

        const id = row.dataset.id; // Retrieve the id from the data attribute

        fetch(`/data/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        }).then(() => {
            row.querySelector(".edit-button").disabled = false;
            row.querySelector(".save-button").disabled = true;
        }).catch((error) => {
            console.error("Error saving data:", error);
        });
    }

    function deleteRow(row) {
        const id = row.dataset.id; // Retrieve the id from the data attribute

        fetch(`/data/${id}`, {
            method: "DELETE",
        }).then(() => {
            row.remove();
        }).catch((error) => {
            console.error("Error deleting data:", error);
        });
    }

    function showMessage(message, type) {
        messageContainer.textContent = message;
        messageContainer.className = type;
        setTimeout(() => {
            messageContainer.textContent = "";
            messageContainer.className = "";
        }, 5000);
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

    // Add event listeners for plus and minus buttons
    plusButton.addEventListener("click", addFilter);
    minusButton.addEventListener("click", removeFilter);
    searchButton.addEventListener("click", applyFilters);

    function addFilter() {
        const filterCount = filtersContainer.querySelectorAll(".filter").length;
        if (filterCount < 6) {
            const filterDiv = document.createElement("div");
            filterDiv.className = "filter";
            filterDiv.innerHTML = `
                <select class="dropdown">
                    <option value="">Pick an Option</option>
                    <option value="title">Title</option>
                    <option value="issn">ISSN</option>
                    <option value="publisher">Publisher</option>
                    <option value="ranking">Ranking</option>
                    <option value="discipline">Discipline</option>
                    <option value="journalHome">Journal Homepage</option>
                </select>
                <input type="text" placeholder="Please Enter a Keyword..." class="search-input">
            `;
            filtersContainer.appendChild(filterDiv);
        }
    }

    function removeFilter() {
        const filters = filtersContainer.querySelectorAll(".filter");
        if (filters.length > 1) {
            filters[filters.length - 1].remove();
        }
    }

    function applyFilters() {
        const filters = filtersContainer.querySelectorAll(".filter");
        const filterCriteria = [];

        let reloadPage = false;

        filters.forEach(filter => {
            const dropdown = filter.querySelector(".dropdown").value;
            const searchInput = filter.querySelector(".search-input").value.trim().toLowerCase();
            if (dropdown === "") {
                reloadPage = true;
            } else if (dropdown && searchInput) {
                filterCriteria.push({ key: dropdown, value: searchInput });
            }
        });

        if (reloadPage) {
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            return;
        }

        const rows = tableBody.querySelectorAll("tr");
        rows.forEach(row => {
            let match = true;
            filterCriteria.forEach(criteria => {
                const cell = row.querySelector(`td[data-key="${criteria.key}"]`);
                if (cell && !cell.textContent.toLowerCase().includes(criteria.value)) {
                    match = false;
                }
            });
            row.style.display = match ? "" : "none";
        });
    }
});