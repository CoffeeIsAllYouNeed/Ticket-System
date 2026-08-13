const BACKEND_API = window.ENV?.BACKEND_API || "http://127.0.0.1:5000";

// Ticket subject/sender/body come from user input (customers, or raw emails)
// and must never be inserted into innerHTML unescaped, or a malicious ticket
// could run arbitrary script in a staff member's browser.
function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    switchRole();
});

function switchRole() {
    const role = document.getElementById("profileSelect").value;

    // Hide all sections
    document.getElementById("customerView").classList.remove("active");
    document.getElementById("departmentView").classList.remove("active");
    document.getElementById("adminView").classList.remove("active");

    if (role === "Customer") {
        document.getElementById("customerView").classList.add("active");
    } else if (role === "Admin") {
        document.getElementById("adminView").classList.add("active");
        loadTickets(role);
    } else {
        document.getElementById("departmentView").classList.add("active");
        document.getElementById("deptTitle").innerText = `${role} Department Queue`;
        loadTickets(role);
    }
}

async function handleTicketSubmit(event) {
    event.preventDefault();
    const statusBanner = document.getElementById("submitStatus");
    const submitBtn = document.getElementById("submitBtn");

    const payload = {
        sender: document.getElementById("senderEmail").value,
        subject: document.getElementById("subject").value,
        body: document.getElementById("body").value
    };

    submitBtn.disabled = true;
    submitBtn.innerText = "Processing ML Classification...";

    try {
        const response = await fetch(`${BACKEND_API}/api/tickets/incoming`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            statusBanner.className = "status-banner success";
            statusBanner.innerText = `✅ Ticket Created & Classified as [${data.ticket.category}] (${(data.ticket.confidence * 100).toFixed(1)}% confidence)`;
            document.getElementById("ticketForm").reset();
        } else {
            throw new Error(data.error || "Submission failed");
        }
    } catch (err) {
        statusBanner.className = "status-banner error";
        statusBanner.innerText = `❌ Error: ${err.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "🚀 Send Ticket";
    }
}

async function loadTickets(role) {
    try {
        const response = await fetch(`${BACKEND_API}/api/tickets`);
        const allTickets = await response.json();

        if (role === "Admin") {
            renderAdminView(allTickets);
        } else {
            // Filter tickets matching selected department role
            const filtered = allTickets.filter(t => t.category.toLowerCase() === role.toLowerCase());
            renderDepartmentView(filtered);
        }
    } catch (err) {
        console.error("Failed to fetch tickets:", err);
    }
}

function renderDepartmentView(tickets) {
    const container = document.getElementById("departmentTickets");
    const countBadge = document.getElementById("ticketCountBadge");
    
    countBadge.innerText = `${tickets.length} Tickets`;
    container.innerHTML = "";

    if (tickets.length === 0) {
        container.innerHTML = `<p class="subtitle">No active tickets assigned to this department queue.</p>`;
        return;
    }

    tickets.forEach(t => {
        const card = document.createElement("div");
        card.className = "ticket-card";
        card.innerHTML = `
            <h3>${escapeHtml(t.subject)}</h3>
            <div class="meta">
                <span>From: ${escapeHtml(t.sender)}</span> • 
                <span class="confidence-tag">${(t.confidence * 100).toFixed(1)}% Match</span>
            </div>
            <p class="body">${escapeHtml(t.body)}</p>
            <span class="meta">${escapeHtml(t.timestamp)}</span>
        `;
        container.appendChild(card);
    });
}

function renderAdminView(tickets) {
    const container = document.getElementById("adminTableContainer");

    if (tickets.length === 0) {
        container.innerHTML = `<p class="subtitle">No tickets found in the system database.</p>`;
        return;
    }

    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Sender</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Confidence</th>
                    <th>Probabilities (Bill | Tech | HR | Gen)</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
    `;

    tickets.forEach(t => {
        const p = t.probabilities;
        html += `
            <tr>
                <td>#${t.id}</td>
                <td>${escapeHtml(t.sender)}</td>
                <td>${escapeHtml(t.subject)}</td>
                <td><span class="badge count-badge">${escapeHtml(t.category)}</span></td>
                <td><span class="confidence-tag">${(t.confidence * 100).toFixed(1)}%</span></td>
                <td class="prob-matrix">
                    B: ${(p.Billing * 100).toFixed(0)}% | 
                    T: ${(p.Technical * 100).toFixed(0)}% | 
                    H: ${(p.HR * 100).toFixed(0)}% | 
                    G: ${(p.General * 100).toFixed(0)}%
                </td>
                <td>${escapeHtml(t.timestamp)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}