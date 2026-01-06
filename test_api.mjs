import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/games';

async function testCRUD() {
    console.log('Starting CRUD Test...');
    let gameId = null;

    // 1. CREATE
    console.log('\n--- Testing CREATE (POST) ---');
    try {
        const createRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Game',
                thumb: 'https://example.com/thumb.jpg',
                categories: ['Action', 'Test'],
                description: 'This is a test game',
                embedurl: 'https://example.com/game',
                orientation: 'portrait'
            })
        });
        const createData = await createRes.json();
        if (createData.success) {
            console.log('✅ Created:', createData.data.title);
            gameId = createData.data.uid;
        } else {
            console.error('❌ Create Failed:', createData.error);
            return;
        }
    } catch (err) {
        console.error('❌ Create Error:', err.message);
        return;
    }

    // 2. READ (List)
    console.log('\n--- Testing READ LIST (GET) ---');
    try {
        const listRes = await fetch(BASE_URL);
        const listData = await listRes.json();
        if (listData.success) {
            const found = listData.data.find(g => g.uid === gameId);
            if (found) console.log('✅ Game found in list');
            else console.error('❌ Game NOT found in list');
        } else {
            console.error('❌ List Failed:', listData.error);
        }
    } catch (err) {
        console.error('❌ List Error:', err.message);
    }

    // 3. UPDATE
    console.log('\n--- Testing UPDATE (PATCH) ---');
    if (gameId) {
        try {
            const updateRes = await fetch(`${BASE_URL}/${gameId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Game UPDATED'
                })
            });
            const updateData = await updateRes.json();
            if (updateData.success && updateData.data.title === 'Test Game UPDATED') {
                console.log('✅ Updated:', updateData.data.title);
            } else {
                console.error('❌ Update Failed:', updateData.error || 'Title mismatch');
            }
        } catch (err) {
            console.error('❌ Update Error:', err.message);
        }
    }

    // 4. DELETE
    console.log('\n--- Testing DELETE (DELETE) ---');
    if (gameId) {
        try {
            const deleteRes = await fetch(`${BASE_URL}/${gameId}`, {
                method: 'DELETE'
            });
            const deleteData = await deleteRes.json();
            if (deleteData.success) {
                console.log('✅ Deleted successfully');
            } else {
                console.error('❌ Delete Failed:', deleteData.error);
            }
        } catch (err) {
            console.error('❌ Delete Error:', err.message);
        }
    }

    // 5. VERIFY DELETION
    console.log('\n--- Verifying Deletion ---');
    if (gameId) {
        try {
            const checkRes = await fetch(`${BASE_URL}/${gameId}`);
            if (checkRes.status === 404) {
                console.log('✅ Game correctly returned 404');
            } else {
                console.error('❌ Game still exists or error:', checkRes.status);
            }
        } catch (err) {
            console.error('❌ Check Error:', err.message);
        }
    }
}

testCRUD();
