const nodemailer = require('nodemailer');
require('dotenv').config();

// ============================================
// CREATE EMAIL TRANSPORTER
// ============================================
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// ============================================
// GENERATE 6-DIGIT OTP
// ============================================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// GENERATE RANDOM TOKEN FOR PASSWORD RESET
// ============================================
const generateToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// ============================================
// SEND VERIFICATION OTP EMAIL
// ============================================
const sendVerificationOTP = async (email, username, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🎓 Verify Your Email - Smart Study Buddy Pro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🎓 Smart Study Buddy Pro</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Email Verification</p>
          </div>
          
          <!-- Body -->
          <div style="padding:40px 30px;">
            <h2 style="color:#1a1a1a;margin:0 0 10px;font-size:20px;">Hello ${username}! 👋</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 25px;">
              Welcome to Smart Study Buddy Pro! Please verify your email address by entering the OTP code below:
            </p>
            
            <!-- OTP Box -->
            <div style="background:#f8f9fa;border:2px dashed #4c6ef5;border-radius:12px;padding:25px;text-align:center;margin:0 0 25px;">
              <p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <h1 style="color:#4c6ef5;font-size:40px;margin:0;letter-spacing:12px;font-weight:700;">${otp}</h1>
            </div>
            
            <p style="color:#999;font-size:13px;line-height:1.5;margin:0 0 20px;">
              ⏰ This code expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.<br>
              🔒 Do not share this code with anyone.
            </p>
            
            <hr style="border:none;border-top:1px solid #eee;margin:25px 0;">
            
            <p style="color:#bbb;font-size:12px;text-align:center;margin:0;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background:#f8f9fa;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:11px;margin:0;">
              © ${new Date().getFullYear()} Smart Study Buddy Pro. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification OTP sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send failed:`, error.message);
    throw error;
  }
};

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
const sendPasswordResetEmail = async (email, username, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🔑 Reset Your Password - Smart Study Buddy Pro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#ef4444,#f97316);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🔑 Password Reset</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Smart Study Buddy Pro</p>
          </div>
          
          <!-- Body -->
          <div style="padding:40px 30px;">
            <h2 style="color:#1a1a1a;margin:0 0 10px;font-size:20px;">Hello ${username}!</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 25px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <!-- Reset Button -->
            <div style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" 
                 style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);color:#ffffff;
                        text-decoration:none;padding:14px 40px;border-radius:10px;
                        font-size:16px;font-weight:600;display:inline-block;">
                Reset My Password
              </a>
            </div>
            
            <p style="color:#999;font-size:13px;line-height:1.5;margin:0 0 15px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color:#4c6ef5;font-size:12px;word-break:break-all;background:#f8f9fa;
                      padding:12px;border-radius:8px;margin:0 0 20px;">
              ${resetUrl}
            </p>
            
            <p style="color:#999;font-size:13px;line-height:1.5;margin:0 0 20px;">
              ⏰ This link expires in <strong>1 hour</strong>.<br>
              🔒 If you didn't request this, ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border:none;border-top:1px solid #eee;margin:25px 0;">
            
            <p style="color:#bbb;font-size:12px;text-align:center;margin:0;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background:#f8f9fa;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:11px;margin:0;">
              © ${new Date().getFullYear()} Smart Study Buddy Pro. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send failed:`, error.message);
    throw error;
  }
};

// ============================================
// SEND PASSWORD RESET OTP EMAIL
// ============================================
const sendPasswordResetOTP = async (email, username, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🔑 Password Reset OTP - Smart Study Buddy Pro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          
          <div style="background:linear-gradient(135deg,#ef4444,#f97316);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🔑 Password Reset</h1>
          </div>
          
          <div style="padding:40px 30px;">
            <h2 style="color:#1a1a1a;margin:0 0 10px;font-size:20px;">Hello ${username}!</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 25px;">
              Use this OTP code to reset your password:
            </p>
            
            <div style="background:#fff3f3;border:2px dashed #ef4444;border-radius:12px;padding:25px;text-align:center;margin:0 0 25px;">
              <p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Your Reset Code</p>
              <h1 style="color:#ef4444;font-size:40px;margin:0;letter-spacing:12px;font-weight:700;">${otp}</h1>
            </div>
            
            <p style="color:#999;font-size:13px;line-height:1.5;">
              ⏰ This code expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.<br>
              🔒 If you didn't request this, ignore this email.
            </p>
          </div>
          
          <div style="background:#f8f9fa;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:11px;margin:0;">© ${new Date().getFullYear()} Smart Study Buddy Pro</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset OTP sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send failed:`, error.message);
    throw error;
  }
};

// ============================================
// SEND WELCOME EMAIL (after verification)
// ============================================
const sendWelcomeEmail = async (email, username) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🎉 Welcome to Smart Study Buddy Pro!',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          
          <div style="background:linear-gradient(135deg,#22c55e,#10b981);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;">🎉 Welcome!</h1>
          </div>
          
          <div style="padding:40px 30px;text-align:center;">
            <h2 style="color:#1a1a1a;margin:0 0 15px;">Hey ${username}!</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 25px;">
              Your email has been verified successfully! You now have full access to Smart Study Buddy Pro.
            </p>
            
            <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 25px;text-align:left;">
              <h3 style="color:#166534;margin:0 0 10px;font-size:14px;">🚀 What you can do now:</h3>
              <ul style="color:#666;font-size:13px;line-height:2;margin:0;padding-left:20px;">
                <li>💬 Chat with AI in 7 different modes</li>
                <li>📝 Practice MCQs with 3 difficulty levels</li>
                <li>🎥 Watch YouTube tutorials in any language</li>
                <li>🖼️ Search educational diagrams</li>
                <li>📊 Track your study progress</li>
              </ul>
            </div>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);color:#ffffff;
                      text-decoration:none;padding:14px 40px;border-radius:10px;
                      font-size:16px;font-weight:600;display:inline-block;">
              Start Studying →
            </a>
          </div>
          
          <div style="background:#f8f9fa;padding:20px 30px;text-align:center;">
            <p style="color:#999;font-size:11px;margin:0;">© ${new Date().getFullYear()} Smart Study Buddy Pro</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Welcome email failed:`, error.message);
    // Don't throw - welcome email is not critical
  }
};

// ============================================
// VERIFY EMAIL CONFIG
// ============================================
const verifyEmailConfig = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
    return false;
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};

module.exports = {
  generateOTP,
  generateToken,
  sendVerificationOTP,
  sendPasswordResetEmail,
  sendPasswordResetOTP,
  sendWelcomeEmail,
  verifyEmailConfig
};