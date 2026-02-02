// trigger_seed.js
const api = 'http://localhost:3300/api/roles/seed';


try {
    const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
} catch (e) {
    console.error("Seed failed:", e);
}
