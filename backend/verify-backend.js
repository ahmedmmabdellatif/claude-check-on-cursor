const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const DUMMY_PDF_PATH = path.join(__dirname, 'dummy_test.pdf');

// A simple PDF with "Hello World"
const VALID_PDF_BUFFER = Buffer.from(
    'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwog' +
    'IC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAv' +
    'TWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0K' +
    'Pj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAg' +
    'L1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+CiAgICA+Pgog' +
    'ID4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9G' +
    'b250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRv' +
    'YmoKCjUgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwIDEw' +
    'IFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAw' +
    'MDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAg' +
    'biAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMzA2IDAwMDAwIG4gCjAwMDAwMDAzOTIg' +
    'MDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhy' +
    'ZWYKNDkyCiUlRU9GCg==',
    'base64'
);

async function runVerification() {
    console.log('🚀 Starting Backend Verification...');

    // 1. Create Dummy PDF
    fs.writeFileSync(DUMMY_PDF_PATH, VALID_PDF_BUFFER);
    console.log('✅ Created dummy PDF:', DUMMY_PDF_PATH);

    try {
        // 2. Upload PDF
        console.log('📤 Uploading PDF to /api/parse...');
        const form = new FormData();
        form.append('file', fs.createReadStream(DUMMY_PDF_PATH));

        const uploadRes = await axios.post(`${API_URL}/parse`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('✅ Upload successful!');
        console.log('   Status:', uploadRes.status);
        console.log('   Data:', JSON.stringify(uploadRes.data, null, 2));

        const { planId } = uploadRes.data;
        if (!planId) throw new Error('No planId returned');

        // 3. Fetch Plan
        console.log(`📥 Fetching plan ${planId}...`);
        const planRes = await axios.get(`${API_URL}/plans/${planId}`);

        console.log('✅ Fetch successful!');
        console.log('   Plan Name:', planRes.data.meta?.plan_name || 'N/A');
        console.log('   Workouts:', planRes.data.workouts?.length || 0);

        console.log('🎉 Backend Verification PASSED!');

    } catch (error) {
        console.error('❌ Verification FAILED');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
    } finally {
        // Cleanup
        if (fs.existsSync(DUMMY_PDF_PATH)) {
            fs.unlinkSync(DUMMY_PDF_PATH);
            console.log('🧹 Cleaned up dummy PDF');
        }
    }
}

runVerification();
