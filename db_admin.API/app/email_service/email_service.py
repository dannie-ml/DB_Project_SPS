# Librerias

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config
import logging

# Configuracion de email

SMTP_SERVER = config('SMTP_SERVER', default='smtp.gmail.com')
SMTP_PORT = config('SMTP_PORT', default=587, cast=int)
SMTP_USERNAME = config('SMTP_USERNAME', default='')
SMTP_PASSWORD = config('SMTP_PASSWORD', default='')
FROM_EMAIL = config('FROM_EMAIL', default='noreply@spsdb.com')

logger = logging.getLogger(__name__)

async def send_password_reset_mail(email: str, full_name: str, reset_token: str):
    """ Envio de mail para reseteo de constraseña """
    try:
        # Crea mensaje
        message = MIMEMultipart("alternative")
        message["Subject"] = "Password Reset - SPS DB"
        message["From"] = FROM_EMAIL
        message["To"] = email

        # Crea URL para el reseteo de password (adjust based on your frontend URL)
        reset_url = f"http://localhost:4200/reset-password?token={reset_token}"

        # HTML
        html = f"""
        <html>
          <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #393a39;">Password Reset Request</h2>
              <p>Hello {full_name},</p>
              <p>You have requested to reset your password for your SPS DB account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}"
                   style="background-color: #393a39; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <p>This link will expire in 1 hour for security reasons.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                SPS Database Administration<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </body>
        </html>
        """

        # Convert to MimeText
        html_part = MIMEText(html, "html")
        message.attach(html_part)

        # Send email
        if SMTP_USERNAME and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)

            logger.info(f"Password reset email sent to {email}")
        else:
            logger.warning("SMTP credentials not configured. Email not sent.")
            print(f"Password reset email would be sent to {email}")
            print(f"Reset URL: {reset_url}")

    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
