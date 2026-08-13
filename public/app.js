let webModel = null;

const samples = [
  {
    subject: "Unauthorized Credit Card Charge",
    body: "I noticed a $49.99 charge on my statement today. I canceled my account three weeks ago. Please issue a refund immediately."
  },
  {
    subject: "System Crash on Data Export",
    body: "Whenever I click Export to CSV on the dashboard, the application throws a 500 error and crashes."
  },
  {
    subject: "Updating Direct Deposit Banking Details",
    body: "I recently changed bank accounts and need to submit a new direct deposit form before next payroll cycle."
  },
  {
    subject: "Office Hours and Holiday Schedule",
    body: "Could you please inform me of the headquarters opening hours during the upcoming public holiday?"
  }
];

let sampleIndex = 0;

async function loadWebModel() {
  try {
    const res = await fetch("model_weights.json");
    if (res.ok) {
      webModel = await res.json();
    }
  } catch (err) {
    console.error("Local web model weights file not loaded, falling back to rule-based engine.");
  }
}

function cleanText(text) {
  return text.toLowerCase()
    .replace(/\{product_purchased\}/g, "product")
    .replace(/http\S+|www\S+/g, "")
    .replace(/\S+@\S+/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyClientSide(text) {
  const t = text.toLowerCase();
  let scores = { "Billing": 0.1, "Technical": 0.1, "HR": 0.1, "General": 0.1 };

  if (/(bill|charge|refund|invoice|payment|credit card|statement|subscription)/.test(t)) scores["Billing"] += 0.8;
  if (/(crash|error|bug|vpn|server|setup|connect|hardware|export|500)/.test(t)) scores["Technical"] += 0.8;
  if (/(payroll|deposit|salary|benefit|leave|employee|hr|onboarding)/.test(t)) scores["HR"] += 0.8;
  if (/(hours|office|holiday|location|inquiry|contact|address)/.test(t)) scores["General"] += 0.8;

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const probs = {};
  for (let k in scores) probs[k] = scores[k] / total;

  const sorted = Object.keys(probs).sort((a, b) => probs[b] - probs[a]);
  return {
    category: sorted[0],
    confidence: probs[sorted[0]],
    probabilities: probs
  };
}

document.addEventListener("DOMContentLoaded", () => {
  loadWebModel();

  const classifyBtn = document.getElementById("classifyBtn");
  const presetBtn = document.getElementById("presetBtn");
  const subjectInput = document.getElementById("ticketSubject");
  const bodyInput = document.getElementById("ticketBody");

  presetBtn.addEventListener("click", () => {
    const s = samples[sampleIndex];
    subjectInput.value = s.subject;
    bodyInput.value = s.body;
    sampleIndex = (sampleIndex + 1) % samples.length;
  });

  classifyBtn.addEventListener("click", () => {
    const subject = subjectInput.value;
    const body = bodyInput.value;
    const combined = `${subject} ${body}`;

    if (!combined.trim()) return;

    const res = classifyClientSide(combined);

    document.querySelector(".placeholder-state").style.display = "none";
    document.querySelector(".prediction-content").style.display = "block";

    document.getElementById("categoryBadge").innerText = res.category;
    document.getElementById("confidenceText").innerText = `${(res.confidence * 100).toFixed(1)}% Confidence`;

    const bars = document.getElementById("probabilityBars");
    bars.innerHTML = "";

    for (let cat in res.probabilities) {
      const pct = (res.probabilities[cat] * 100).toFixed(1);
      bars.innerHTML += `
        <div class="prob-row">
          <div class="prob-labels">
            <span>${cat}</span>
            <span>${pct}%</span>
          </div>
          <div class="prob-track">
            <div class="prob-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }

    document.getElementById("actionNote").innerText = `Auto-routed to the ${res.category} Support Queue.`;
  });
});