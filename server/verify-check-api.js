async function check() {
    try {
        const baseUrl = 'http://localhost:3001/api/auth/check';
        
        const randomUser = 'user' + Date.now();
        console.log(`Checking username: ${randomUser}`);
        const res1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'username', value: randomUser })
        });
        const data1 = await res1.json();
        console.log('Available:', data1.available);

        const randomPhone = '138' + Date.now().toString().slice(-8);
        console.log(`Checking phone: ${randomPhone}`);
        const res2 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'phone', value: randomPhone })
        });
        const data2 = await res2.json();
        console.log('Available:', data2.available);

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
