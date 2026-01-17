"""
Email notification system for EDU-DESK
Sends notifications for comments, ratings, and other events
"""
from flask_mail import Mail, Message
from flask import current_app
import logging

logger = logging.getLogger(__name__)

# Flask-Mail instance (initialized in mainapp.py)
mail = None

def initialize_mail(app):
    """Initialize Flask-Mail with app config"""
    global mail
    mail = Mail(app)
    return mail

def send_email(to, subject, body, html=None):
    """
    Send email notification
    
    Args:
        to: Email address or list of addresses
        subject: Email subject
        body: Plain text body
        html: Optional HTML body
    """
    try:
        if not mail:
            logger.warning("Mail not initialized, skipping email")
            return False
            
        msg = Message(
            subject=subject,
            recipients=[to] if isinstance(to, str) else to,
            body=body,
            html=html
        )
        
        mail.send(msg)
        logger.info(f"Email sent to {to}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_comment_notification(user_email, user_name, note_title, comment_text, note_id):
    """
    Notify note owner about new comment
    
    Args:
        user_email: Owner's email
        user_name: Commenter's name
        note_title: Title of the note
        comment_text: Comment content
        note_id: Note ID for link
    """
    subject = f"New comment on your note: {note_title}"
    
    body = f"""
Hello,

{user_name} commented on your note "{note_title}":

"{comment_text}"

View the note: {current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}/note/{note_id}

Best regards,
EDU-DESK Team
    """
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #4F46E5;">New Comment Notification</h2>
            <p>Hello,</p>
            <p><strong>{user_name}</strong> commented on your note "<em>{note_title}</em>":</p>
            <blockquote style="border-left: 4px solid #4F46E5; padding-left: 16px; color: #555;">
                {comment_text}
            </blockquote>
            <p>
                <a href="{current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}/note/{note_id}" 
                   style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Note
                </a>
            </p>
            <p style="color: #888; font-size: 12px;">
                Best regards,<br>
                EDU-DESK Team
            </p>
        </body>
    </html>
    """
    
    return send_email(user_email, subject, body, html)

def send_rating_notification(user_email, user_name, note_title, rating, note_id):
    """
    Notify note owner about new rating
    
    Args:
        user_email: Owner's email
        user_name: Rater's name
        note_title: Title of the note
        rating: Star rating (1-5)
        note_id: Note ID for link
    """
    subject = f"New {rating}-star rating on your note: {note_title}"
    
    stars = "⭐" * rating
    
    body = f"""
Hello,

{user_name} rated your note "{note_title}" with {rating} stars ({stars})

View the note: {current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}/note/{note_id}

Best regards,
EDU-DESK Team
    """
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #4F46E5;">New Rating Notification</h2>
            <p>Hello,</p>
            <p><strong>{user_name}</strong> rated your note "<em>{note_title}</em>":</p>
            <div style="font-size: 24px; color: #F59E0B; margin: 16px 0;">
                {stars} ({rating}/5)
            </div>
            <p>
                <a href="{current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}/note/{note_id}" 
                   style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Note
                </a>
            </p>
            <p style="color: #888; font-size: 12px;">
                Best regards,<br>
                EDU-DESK Team
            </p>
        </body>
    </html>
    """
    
    return send_email(user_email, subject, body, html)

def send_welcome_email(user_email, user_name):
    """
    Send welcome email to new users
    
    Args:
        user_email: User's email
        user_name: User's display name
    """
    subject = "Welcome to EDU-DESK!"
    
    body = f"""
Hello {user_name},

Welcome to EDU-DESK - Your collaborative educational platform!

Get started:
- Upload your notes and share with the community
- Explore notes from other students
- Rate and comment on helpful resources
- Create collections to organize your study materials

We're excited to have you on board!

Best regards,
EDU-DESK Team
    """
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #4F46E5;">Welcome to EDU-DESK! 🎓</h1>
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>We're excited to have you join our collaborative educational platform!</p>
            <h3>Get Started:</h3>
            <ul>
                <li>📤 Upload your notes and share with the community</li>
                <li>🔍 Explore notes from other students</li>
                <li>⭐ Rate and comment on helpful resources</li>
                <li>📚 Create collections to organize your study materials</li>
            </ul>
            <p>
                <a href="{current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 16px;">
                    Start Exploring
                </a>
            </p>
            <p style="color: #888; font-size: 12px; margin-top: 32px;">
                Best regards,<br>
                EDU-DESK Team
            </p>
        </body>
    </html>
    """
    
    return send_email(user_email, subject, body, html)

def send_moderation_alert(admin_email, note_title, note_id, flagged_by, reason):
    """
    Alert admins about flagged content
    
    Args:
        admin_email: Admin's email
        note_title: Title of flagged note
        note_id: Note ID
        flagged_by: User who flagged
        reason: Flagging reason
    """
    subject = f"Content Flagged: {note_title}"
    
    body = f"""
Admin Alert,

Content has been flagged for moderation:

Note: {note_title}
Flagged by: {flagged_by}
Reason: {reason}

Review the content: {current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}/admin/moderation

EDU-DESK System
    """
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #DC2626;">⚠️ Content Moderation Alert</h2>
            <p>Content has been flagged for review:</p>
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Note:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{note_title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Flagged by:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{flagged_by}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{reason}</td>
                </tr>
            </table>
            <p>
                <a href="{current_app.config.get('FRONTEND_URL', 'https://edu-desk.vercel.app')}/admin/moderation" 
                   style="background-color: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Review Content
                </a>
            </p>
            <p style="color: #888; font-size: 12px;">
                EDU-DESK System
            </p>
        </body>
    </html>
    """
    
    return send_email(admin_email, subject, body, html)
