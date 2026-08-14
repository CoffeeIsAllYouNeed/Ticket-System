// Runs the trained ticket classifier entirely in the browser.
// Mirrors src/dataset.py's clean_text() and the TfidfVectorizer + LogisticRegression
// pipeline in src/model.py, using the weights exported to model_weights.json.

let modelWeights = null;

async function loadModel() {
    if (modelWeights) return modelWeights;
    const res = await fetch("model_weights.json");
    modelWeights = await res.json();
    return modelWeights;
}

// Mirrors src/dataset.py clean_text()
function cleanText(text) {
    if (typeof text !== "string") return "";
    let t = text.toLowerCase();
    t = t.replace(/\{product_purchased\}/g, "product");
    t = t.replace(/http\S+|www\S+|https\S+/g, "");
    t = t.replace(/\S+@\S+/g, "");
    t = t.replace(/[^a-z\s]/g, " ");
    t = t.replace(/\s+/g, " ").trim();
    return t;
}

// Mirrors sklearn's default TfidfVectorizer tokenizer: words of 2+ word-characters
function tokenize(text) {
    return text.match(/\b\w\w+\b/g) || [];
}

// Builds unigrams + bigrams, matching ngram_range=(1, 2)
function buildNgrams(tokens) {
    const ngrams = [...tokens];
    for (let i = 0; i < tokens.length - 1; i++) {
        ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return ngrams;
}

function vectorize(text, model) {
    const cleaned = cleanText(text);
    const ngrams = buildNgrams(tokenize(cleaned));

    const counts = {};
    for (const term of ngrams) {
        if (term in model.vocabulary) {
            counts[term] = (counts[term] || 0) + 1;
        }
    }

    const vecSize = model.idf.length;
    const vec = new Array(vecSize).fill(0);
    for (const [term, count] of Object.entries(counts)) {
        const idx = model.vocabulary[term];
        const tf = 1 + Math.log(count);
        vec[idx] = tf * model.idf[idx];
    }

    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
        for (let i = 0; i < vec.length; i++) vec[i] /= norm;
    }
    return vec;
}

function softmax(scores) {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

async function classifyTicket(subject, body) {
    const model = await loadModel();
    const vec = vectorize(`${subject} ${body}`, model);

    const scores = model.classes.map((_, classIdx) => {
        const coefRow = model.coefficients[classIdx];
        let dot = model.intercepts[classIdx];
        for (let i = 0; i < vec.length; i++) {
            if (vec[i] !== 0) dot += coefRow[i] * vec[i];
        }
        return dot;
    });

    const probs = softmax(scores);
    const bestIdx = probs.indexOf(Math.max(...probs));

    const probabilities = {};
    model.classes.forEach((cls, i) => { probabilities[cls] = probs[i]; });

    return {
        category: model.classes[bestIdx],
        confidence: probs[bestIdx],
        probabilities
    };
}