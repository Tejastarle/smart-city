// ===============================
// BASE CONFIG
// ===============================
const API_BASE = "";

// ===============================
// GLOBAL STATE
// ===============================
let complaints = [];
let currentFilter = "All";

// ===============================
// INIT (AUTO DETECT PAGE)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tableBody")) {
        // ADMIN PAGE
        loadComplaints();
        loadStats();
    }

    if (document.getElementById("reportForm")) {
        // REPORT PAGE
        setupReportForm();
    }
});


// ===============================
// REPORT FORM (report.html)
// ===============================
function setupReportForm() {
    const form = document.getElementById("reportForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const res = await fetch("/api/report", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            alert("Complaint Submitted Successfully!");

            form.reset();

        } catch (err) {
            alert("Error submitting complaint");
        }
    });
}


// ===============================
// ADMIN - LOAD DATA
// ===============================
async function loadComplaints() {
    try {
        const res = await fetch("/api/complaints");
        complaints = await res.json();
        renderTable();
    } catch (err) {
        console.error(err);
    }
}

async function loadStats() {
    try {
        const res = await fetch("/api/stats");
        const data = await res.json();

        document.getElementById("total").innerText = data.total;
        document.getElementById("pending").innerText = data.pending;
        document.getElementById("progress").innerText = data.progress;
        document.getElementById("resolved").innerText = data.resolved;

    } catch (err) {
        console.error(err);
    }
}


// ===============================
// ADMIN - RENDER TABLE
// ===============================
function renderTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let filtered = complaints;

    if (currentFilter !== "All") {
        filtered = complaints.filter(c => c.status === currentFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No complaints found</td></tr>`;
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${c.name || "-"}</td>
            <td>${c.category || "-"}</td>
            <td>${c.location || "-"}</td>
            <td class="${getStatusClass(c.status)}">${c.status}</td>
            <td>
                ${c.image ? `<img src="${c.image}" width="60"/>` : "No Image"}
            </td>
            <td>
                <button onclick="viewDetails('${c._id}')">View</button>
                <button class="btn-progress" onclick="updateStatus('${c._id}', 'In Progress')">Progress</button>
                <button class="btn-resolved" onclick="updateStatus('${c._id}', 'Resolved')">Resolve</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}


// ===============================
// STATUS CLASS
// ===============================
function getStatusClass(status) {
    if (status === "Pending") return "pending";
    if (status === "In Progress") return "progress";
    if (status === "Resolved") return "resolved";
    return "";
}


// ===============================
// FILTER (ADMIN)
// ===============================
function filterStatus(status) {
    currentFilter = status;

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    event.target.classList.add("active");

    renderTable();
}


// ===============================
// UPDATE STATUS
// ===============================
async function updateStatus(id, status) {
    try {
        await fetch(`/api/update-status/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        loadComplaints();
        loadStats();

    } catch (err) {
        console.error(err);
        alert("Failed to update status");
    }
}


// ===============================
// VIEW DETAILS
// ===============================
async function viewDetails(id) {
    try {
        const res = await fetch(`/api/complaint/${id}`);
        const c = await res.json();

        const panel = document.getElementById("details");

        panel.innerHTML = `
            <h3>Complaint Details</h3>
            <p><b>Name:</b> ${c.name}</p>
            <p><b>Category:</b> ${c.category}</p>
            <p><b>Location:</b> ${c.location}</p>
            <p><b>Status:</b> ${c.status}</p>
            <p><b>Description:</b> ${c.description}</p>
            <p><b>Date:</b> ${new Date(c.date).toLocaleString()}</p>
            ${c.image ? `<img src="${c.image}" width="200"/>` : ""}
        `;

    } catch (err) {
        console.error(err);
    }
}


// ===============================
// OPTIONAL: AUTO REFRESH
// ===============================
setInterval(() => {
    if (document.getElementById("tableBody")) {
        loadComplaints();
        loadStats();
    }
}, 10000); // every 10 sec


// ===============================
// OPTIONAL: LOCATION BUTTON
// ===============================
function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        const locationInput = document.getElementById("location");
        if (locationInput) {
            locationInput.value = `${latitude}, ${longitude}`;
        }

    }, () => {
        alert("Unable to fetch location");
    });
}