require('dotenv').config();
const { sendPasswordResetOTP } = require('./utils/emailService');

async function testEmail() {
    try {
        console.log('Testing password reset OTP email...');
        await sendPasswordResetOTP('aamir.0206slm@gmail.com', 'Test User', '123456');
        console.log('Success!');
    } catch (err) {
        console.error('Failed:', err);
    }
}

testEmail();
