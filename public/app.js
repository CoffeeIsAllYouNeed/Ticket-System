const STORAGE_KEY = "tickets";

document.addEventListener("DOMContentLoaded", () => {
    switchRole();
});

function selectRole(roleName) {
    const profileSelect = document.getElementById("profileSelect");
    if (profileSelect) {
        profileSelect.value = roleName;
        switchRole();
    }
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
    const customerBtn = document.getElementById("customerSupportBtn");

    document.getElementById("customerView").classList.remove("active");
    document.getElementById("dashboardView").classList.remove("active");
    customerBtn.classList.remove("active");

    if (role === "Customer") {
        document.getElementById("customerView").classList.add("active");
        customerBtn.classList.add("active");
    } else {
        document.getElementById("dashboardView").classList.add("active");
        document.getElementById("viewHeading").innerText = "Received Complaints";
        document.getElementById("viewSubheading").innerText = `Viewing as: ${role}`;
        loadDashboard(role);
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
        statusBanner.innerText = `Complaint submitted! Classified to ${ticket.category} (${(ticket.confidence * 100).toFixed(0)}% match)`;
        document.getElementById("ticketForm").reset();
    } catch (err) {
        statusBanner.className = "status-banner error";
        statusBanner.innerText = `Error: ${err.message}`;
    } finally {
        submitBtn.disabled = false;
    }
}

function loadDashboard(role) {
    const allTickets = getTickets().slice().sort((a, b) => b.id - a.id);
    const filtered = (role === "Admin") 
        ? allTickets 
        : allTickets.filter(t => t.category.toLowerCase() === role.toLowerCase());

    updateStats(allTickets.length, filtered.length);
    renderTable(filtered);
}

function updateStats(totalCount, openCount) {
    document.getElementById("statTotal").innerText = totalCount;
    document.getElementById("statOpen").innerText = openCount;
    document.getElementById("statResolved").innerText = Math.max(0, totalCount - openCount);
}

function renderTable(tickets) {
    const container = document.getElementById("tableContainer");
    document.getElementById("footerCount").innerText = `Showing ${tickets.length} complaints`;

    if (tickets.length === 0) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted)">No complaints recorded yet.</div>`;
        return;
    }

    let html = `
        <table class="complaints-table">
            <thead>
                <tr>
                    <th>CUSTOMER EMAIL</th>
                    <th>SUBJECT</th>
                    <th>MESSAGE PREVIEW</th>
                    <th style="text-align:right">SUBMITTED</th>
                </tr>
            </thead>
            <tbody>
    `;

    tickets.forEach(t => {
        html += `
            <tr>
                <td class="email-col"><span class="status-dot"></span> ${escapeHtml(t.sender)}</td>
                <td class="subject-col">${escapeHtml(t.subject)}</td>
                <td class="preview-col">${escapeHtml(t.body)}</td>
                <td class="time-col">${formatTimeAgo(t.timestamp)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function filterTickets() {
    const role = document.getElementById("profileSelect").value;
    const query = document.getElementById("searchInput").value.toLowerCase();
    const allTickets = getTickets().slice().sort((a, b) => b.id - a.id);
    
    let filtered = (role === "Admin") 
        ? allTickets 
        : allTickets.filter(t => t.category.toLowerCase() === role.toLowerCase());

    if (query) {
        filtered = filtered.filter(t => 
            t.sender.toLowerCase().includes(query) || 
            t.subject.toLowerCase().includes(query)
        );
    }
    renderTable(filtered);
}

function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const diffMins = Math.floor((new Date() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return "Yesterday";
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}