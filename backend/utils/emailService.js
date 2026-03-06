const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 DNS resolution (Render free tier doesn't support IPv6)
dns.setDefaultResultOrder('ipv4first');

// ============================================
// LOGO - hosted on ImageKit (public CDN, always visible in emails)
// ============================================
const LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://ik.imagekit.io/Aamir02/email-assets/campus-genie-logo.png';

const LOGO_BLOCK = `<img src="${LOGO_URL}" alt="Campus Genie AI" width="80" height="80" style="width:80px;height:80px;border-radius:18px;background:white;padding:6px;box-shadow:0 4px 20px rgba(0,0,0,0.35);display:block;margin:0 auto 14px;" />`;



// ============================================
// CREATE EMAIL TRANSPORTER
// ============================================
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
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
// SHARED EMAIL WRAPPER
// ============================================
const emailWrapper = (headerBg, headerContent, bodyContent) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;padding:30px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.12);max-width:520px;">
        <!-- HEADER -->
        <tr><td style="background:${headerBg};padding:36px 30px 28px;text-align:center;">
          ${LOGO_BLOCK}
          <br>
          ${headerContent}
        </td></tr>
        <!-- BODY -->
        <tr><td style="padding:36px 32px;">
          ${bodyContent}
        </td></tr>
        <!-- FOOTER -->
        <tr><td style="background:#f7f7fb;padding:18px 30px;text-align:center;border-top:1px solid #e8e8f0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            &copy; ${new Date().getFullYear()} <strong>Campus Genie AI</strong> &bull; All rights reserved
          </p>
          <p style="color:#c4b5fd;font-size:11px;margin:6px 0 0;">
            &#10024; Your AI Study Companion
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ============================================
// SEND VERIFICATION OTP EMAIL
// ============================================
const sendVerificationOTP = async (email, username, otp) => {
  const transporter = createTransporter();

  const header = `
      <h1 style="color:#ffffff;margin:10px 0 4px;font-size:22px;font-weight:700;letter-spacing:0.3px;">&#127891; Campus Genie AI</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;font-weight:500;">Email Verification</p>`;

  const body = `
      <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Hello, ${username}! &#128075;</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Welcome to <strong>Campus Genie AI</strong>! Please verify your email address using the code below:
      </p>
      <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px dashed #8b5cf6;border-radius:14px;padding:26px;text-align:center;margin:0 0 24px;">
        <p style="color:#6d28d9;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Verification Code</p>
        <span style="color:#4c1d95;font-size:44px;font-weight:800;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</span>
      </div>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="background:#fdf4ff;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.6;">
            &#9200; Expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong><br>
            &#128274; Never share this code with anyone
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 20px;">
      <p style="color:#bbb;font-size:12px;text-align:center;margin:0;">
        Didn't create an account? You can safely ignore this email.
      </p>`;

  const mailOptions = {
    from: `"Campus Genie AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎓 Verify Your Email - Campus Genie AI',
    html: emailWrapper('linear-gradient(135deg,#4c6ef5 0%,#7c3aed 100%)', header, body)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification OTP sent to ${email} | OTP: ${otp} | MessageID: ${info.messageId}`);
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

  const header = `
      <h1 style="color:#ffffff;margin:10px 0 4px;font-size:22px;font-weight:700;">&#128273; Campus Genie AI</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;font-weight:500;">Password Reset</p>`;

  const body = `
      <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Hello, ${username}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We received a request to reset your <strong>Campus Genie AI</strong> password. Click the button below to create a new password:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);color:#ffffff;text-decoration:none;padding:15px 44px;border-radius:12px;font-size:16px;font-weight:700;display:inline-block;letter-spacing:0.3px;">
          &#128273; Reset My Password
        </a>
      </div>
      <p style="color:#888;font-size:13px;margin:0 0 8px;">Or copy this link into your browser:</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:12px 14px;word-break:break-all;font-size:12px;color:#6d28d9;margin:0 0 22px;">${resetUrl}</div>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="background:#fff7f7;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.6;">
            &#9200; This link expires in <strong>1 hour</strong><br>
            &#128274; If you didn't request this, your password is safe — just ignore this email
          </td>
        </tr>
      </table>`;

  const mailOptions = {
    from: `"Campus Genie AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 Reset Your Password - Campus Genie AI',
    html: emailWrapper('linear-gradient(135deg,#ef4444 0%,#f97316 100%)', header, body)
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

  const header = `
      <h1 style="color:#ffffff;margin:10px 0 4px;font-size:22px;font-weight:700;">&#128273; Campus Genie AI</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;font-weight:500;">Password Reset OTP</p>`;

  const body = `
      <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Hello, ${username}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Use the OTP code below to reset your <strong>Campus Genie AI</strong> password:
      </p>
      <div style="background:linear-gradient(135deg,#fff1f2,#ffe4e6);border:2px dashed #ef4444;border-radius:14px;padding:26px;text-align:center;margin:0 0 24px;">
        <p style="color:#dc2626;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Reset Code</p>
        <span style="color:#991b1b;font-size:44px;font-weight:800;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</span>
      </div>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="background:#fff7f7;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.6;">
            &#9200; Expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong><br>
            &#128274; If you didn't request this, ignore this email
          </td>
        </tr>
      </table>`;

  const mailOptions = {
    from: `"Campus Genie AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 Password Reset OTP - Campus Genie AI',
    html: emailWrapper('linear-gradient(135deg,#ef4444 0%,#f97316 100%)', header, body)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset OTP sent to ${email} | OTP: ${otp}`);
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

  const header = `
      <h1 style="color:#ffffff;margin:10px 0 4px;font-size:22px;font-weight:700;">&#127881; Campus Genie AI</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;font-weight:500;">Welcome Aboard!</p>`;

  const body = `
      <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Hey ${username}! &#127775;</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 22px;">
        Your email has been <strong style="color:#16a34a;">verified successfully</strong>! You now have full access to <strong>Campus Genie AI</strong> — your AI-powered study companion.
      </p>
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:20px 22px;margin:0 0 26px;">
        <p style="color:#166534;font-size:13px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">&#128640; What you can do now:</p>
        <table cellpadding="0" cellspacing="4" width="100%">
          <tr><td style="color:#374151;font-size:14px;padding:3px 0;">&#128172; Chat with AI in multiple learning modes</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:3px 0;">&#128221; Practice MCQs with adaptive difficulty</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:3px 0;">&#127909; Watch YouTube tutorials in any language</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:3px 0;">&#128444; Search educational diagrams &amp; images</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:3px 0;">&#128202; Track your study progress &amp; analytics</td></tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);color:#ffffff;text-decoration:none;padding:15px 48px;border-radius:12px;font-size:16px;font-weight:700;display:inline-block;">
          &#9889; Start Studying Now
        </a>
      </div>`;

  const mailOptions = {
    from: `"Campus Genie AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to Campus Genie AI!',
    html: emailWrapper('linear-gradient(135deg,#22c55e 0%,#10b981 100%)', header, body)
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