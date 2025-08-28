const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // Gmail configuration - you can change this to any email service
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app password
      },
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5000"
    }/reset-password.html?token=${resetToken}`;

    const mailOptions = {
      from: `"Harvest Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - Harvest Hub",
      html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center; font-size: 24px;">
                            🌾 Harvest Hub
                        </h1>
                        <p style="color: white; text-align: center; margin: 10px 0 0 0;">
                            Password Reset Request
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #374151; margin-bottom: 20px;">Reset Your Password</h2>
                        
                        <p style="color: #6B7280; line-height: 1.6; margin-bottom: 20px;">
                            We received a request to reset the password for your Harvest Hub account associated with this email address.
                        </p>
                        
                        <p style="color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
                            Click the button below to reset your password. This link will expire in 1 hour.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Reset My Password
                            </a>
                        </div>
                        
                        <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                        
                        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <span style="word-break: break-all;">${resetUrl}</span>
                        </p>
                        
                        <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 20px;">
                            © 2024 Harvest Hub. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Password reset email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service connection is ready");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
