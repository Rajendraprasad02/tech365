const fs = require('fs');

async function fetchConversation() {
    try {
        const response = await fetch('http://localhost:8000/whatsapp/conversation/918610808451');
        const data = await response.json();
        fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
        console.log('Data written to debug_output.json');
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchConversation();
