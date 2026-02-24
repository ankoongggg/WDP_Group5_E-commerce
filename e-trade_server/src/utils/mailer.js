const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendResetPasswordEmail = async ({ email, resetLink, name }) => {
    const mailOptions = {
        from: `"${process.env.SMTP_NAME || 'ShopModern'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Password - ShopModern',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:#ec5b13;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">🔐 Password Reset</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:16px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password. This link will expire in <strong>15 minutes</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" style="display:inline-block;background:#ec5b13;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:14px;">Reset Password</a>
      </div>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">
      <p style="color:#cbd5e1;font-size:11px;text-align:center;">ShopModern &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };
