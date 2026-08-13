const BACKEND_API = window.ENV?.BACKEND_API || "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    switchRole();
});

async function switchRole() {
    const role = document.getElementById("profileSelect").value;
    const container = document.getElementById("ticketsContainer");
    container.innerHTML = "<p>Loading tickets...</p>";

    try {
        const response = await fetch(`${BACKEND_API}/api/tickets?role=${role}`);
        const data = await response.json();

        container.innerHTML = "";

        if (data.tickets.length === 0) {
            container.innerHTML = `<p class="empty-msg">No tickets currently in the ${role} queue.</p>`;
            return;
        }

        if (role === "Admin") {
            renderAdminView(data.tickets, container);
        } else {
            renderDepartmentView(data.tickets, container);
        }
    } catch (err) {
        container.innerHTML = `<p class="error-msg">Failed to load tickets. Check backend connectivity.</p>`;
    }
}

function renderDepartmentView(tickets, container) {
    tickets.forEach(t => {
        const card = document.createElement("div");
        card.className = "ticket-card";
        card.innerHTML = `
            <h3>${t.subject}</h3>
            <p class="meta"><strong>From:</strong> ${t.sender} | <strong>Confidence:</strong> ${(t.confidence * 100).toFixed(1)}%</p>
            <p class="body">${t.body}</p>
            <span class="timestamp">${t.timestamp}</span>
        `;
        container.appendChild(card);
    });
}

function renderAdminView(tickets, container) {
    const table = document.createElement("table");
    table.className = "admin-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Sender</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Probability Breakdown (Billing | Tech | HR | General)</th>
                <th>Time</th>
            </tr>
        </thead>
        <tbody>
            ${tickets.map(t => `
                <tr>
                    <td>#${t.id}</td>
                    <td>${t.sender}</td>
                    <td>${t.subject}</td>
                    <td><span class="badge">${t.category}</span></td>
                    <td>${(t.confidence * 100).toFixed(1)}%</td>
                    <td class="prob-matrix">
                        B: ${(t.prob_billing * 100).toFixed(1)}% | 
                        T: ${(t.prob_technical * 100).toFixed(1)}% | 
                        H: ${(t.prob_hr * 100).toFixed(1)}% | 
                        G: ${(t.prob_general * 100).toFixed(1)}%
                    </td>
                    <td>${t.timestamp}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);
}