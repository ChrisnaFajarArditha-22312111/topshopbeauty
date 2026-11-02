"""
email.py — Layanan pengiriman email untuk Topshop Kosmetik AI
Menggunakan aiosmtplib untuk pengiriman email secara asinkron via SMTP
"""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import aiosmtplib

from app.core.config import settings

# Logger untuk modul email
logger = logging.getLogger(__name__)


# =========================================================
# Fungsi Inti Pengiriman Email
# =========================================================
async def send_email(
    to: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
) -> bool:
    """
    Kirim email via SMTP secara asinkron.

    Args:
        to: Alamat email penerima
        subject: Subjek email
        body: Isi email dalam format teks biasa
        html_body: Isi email dalam format HTML (opsional)

    Returns:
        True jika email berhasil dikirim, False jika gagal
    """
    # Buat pesan email
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to

    # Tambahkan bagian teks biasa
    part_text = MIMEText(body, "plain", "utf-8")
    message.attach(part_text)

    # Tambahkan bagian HTML jika ada
    if html_body:
        part_html = MIMEText(html_body, "html", "utf-8")
        message.attach(part_html)

    try:
        use_tls = settings.SMTP_PORT == 465
        start_tls = settings.SMTP_PORT != 465

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            use_tls=use_tls,
            start_tls=start_tls,
        )
        logger.info(f"Email berhasil dikirim ke: {to} | Subjek: {subject}")
        return True

    except aiosmtplib.SMTPException as e:
        logger.error(f"Gagal mengirim email ke {to}: {e}")
        return False
    except Exception as e:
        logger.error(f"Error tidak terduga saat mengirim email ke {to}: {e}")
        return False


# =========================================================
# Template Email — Verifikasi OTP
# =========================================================
async def send_verification_email(to: str, otp: str) -> bool:
    """
    Kirim email verifikasi berisi kode OTP 6 digit.
    OTP berlaku selama 10 menit.

    Args:
        to: Alamat email pengguna yang baru mendaftar
        otp: Kode OTP 6 digit (plaintext, sebelum di-hash ke database)

    Returns:
        True jika email berhasil dikirim
    """
    subject = "Verifikasi Email — Topshop Kosmetik"

    body = (
        f"Halo!\n\n"
        f"Terima kasih telah mendaftar di Topshop Kosmetik.\n\n"
        f"Kode verifikasi email Anda:\n\n"
        f"    {otp}\n\n"
        f"Kode ini berlaku selama 10 menit.\n"
        f"Jangan bagikan kode ini kepada siapapun.\n\n"
        f"Jika Anda tidak mendaftar di Topshop Kosmetik, abaikan email ini.\n\n"
        f"Salam,\n"
        f"Tim Topshop Kosmetik"
    )

    html_body = f"""
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: linear-gradient(135deg, #e91e8c, #c2185b); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Topshop Kosmetik</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Verifikasi Email Anda</p>
    </div>

    <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Halo!</p>
        <p>Terima kasih telah mendaftar di <strong>Topshop Kosmetik</strong>.</p>
        <p>Masukkan kode verifikasi berikut untuk mengaktifkan akun Anda:</p>

        <div style="background: #f5f5f5; border: 2px dashed #e91e8c; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e91e8c;">{otp}</span>
        </div>

        <p style="color: #666; font-size: 14px;">
            ⏱️ Kode ini berlaku selama <strong>10 menit</strong>.<br>
            🔒 Jangan bagikan kode ini kepada siapapun.
        </p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

        <p style="color: #999; font-size: 12px;">
            Jika Anda tidak mendaftar di Topshop Kosmetik, abaikan email ini.
        </p>
    </div>
</body>
</html>
"""

    return await send_email(to=to, subject=subject, body=body, html_body=html_body)


# =========================================================
# Template Email — Reset Password
# =========================================================
async def send_password_reset_email(to: str, otp: str) -> bool:
    """
    Kirim email berisi kode OTP untuk reset password.
    OTP berlaku selama 10 menit.

    Args:
        to: Alamat email pengguna yang meminta reset password
        otp: Kode OTP 6 digit (plaintext)

    Returns:
        True jika email berhasil dikirim
    """
    subject = "Reset Password — Topshop Kosmetik"

    body = (
        f"Halo!\n\n"
        f"Kami menerima permintaan reset password untuk akun Anda.\n\n"
        f"Kode verifikasi reset password Anda:\n\n"
        f"    {otp}\n\n"
        f"Kode ini berlaku selama 10 menit.\n"
        f"Jangan bagikan kode ini kepada siapapun.\n\n"
        f"Jika Anda tidak meminta reset password, segera amankan akun Anda.\n\n"
        f"Salam,\n"
        f"Tim Topshop Kosmetik"
    )

    html_body = f"""
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: linear-gradient(135deg, #e91e8c, #c2185b); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Topshop Kosmetik</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Reset Password</p>
    </div>

    <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Halo!</p>
        <p>Kami menerima permintaan <strong>reset password</strong> untuk akun Anda di Topshop Kosmetik.</p>
        <p>Masukkan kode verifikasi berikut untuk melanjutkan:</p>

        <div style="background: #f5f5f5; border: 2px dashed #ff5722; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ff5722;">{otp}</span>
        </div>

        <p style="color: #666; font-size: 14px;">
            ⏱️ Kode ini berlaku selama <strong>10 menit</strong>.<br>
            🔒 Jangan bagikan kode ini kepada siapapun.
        </p>

        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #e65100; font-size: 14px;">
                ⚠️ Jika Anda <strong>tidak</strong> meminta reset password, segera amankan akun Anda dan hubungi tim support kami.
            </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

        <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
        </p>
    </div>
</body>
</html>
"""

    return await send_email(to=to, subject=subject, body=body, html_body=html_body)
