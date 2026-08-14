// Runs entirely client-side: classification via classifier.js (in-browser
// TF-IDF + logistic regression using model_weights.json) and storage via
// localStorage. No backend/API calls of any kind.

const STORAGE_KEY = "tickets";

document.addEventListener("DOMContentLoaded", () => {
    switchRole();
});

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function getTickets() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveTicket(ticket) {
    const tickets = getTickets();
    tickets.push(ticket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function switchRole() {
    const role = document.getElementById("profileSelect").value;

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

    const sender = document.getElementById("senderEmail").value;
    const subject = document.getElementById("subject").value;
    const body = document.getElementById("body").value;

    submitBtn.disabled = true;
    submitBtn.innerText = "Processing ML Classification...";

    try {
        const result = await classifyTicket(subject, body);

        const ticket = {
            id: Date.now(),
            sender,
            subject,
            body,
            category: result.category,
            confidence: result.confidence,
            probabilities: result.probabilities,
            timestamp: new Date().toISOString()
        };
        saveTicket(ticket);

        statusBanner.className = "status-banner success";
        statusBanner.innerText = `✅ Ticket Created & Classified as [${ticket.category}] (${(ticket.confidence * 100).toFixed(1)}% confidence)`;
        document.getElementById("ticketForm").reset();
    } catch (err) {
        statusBanner.className = "status-banner error";
        statusBanner.innerText = `❌ Error: ${err.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "🚀 Send Ticket";
    }
}

function loadTickets(role) {
    const allTickets = getTickets().slice().sort((a, b) => b.id - a.id);

    if (role === "Admin") {
        renderAdminView(allTickets);
    } else {
        const filtered = allTickets.filter(t => t.category.toLowerCase() === role.toLowerCase());
        renderDepartmentView(filtered);
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