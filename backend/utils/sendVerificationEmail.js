import sgMail from '@sendgrid/mail';

export async function sendVerificationEmail(email, verificationLink) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not set');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const fromAddress = process.env.EMAIL_FROM || process.env.SENDGRID_FROM;
  const msg = {
    to: email,
    from: { email: fromAddress, name: 'Omni Media Library' },
    subject: 'Email Verification',
    text: `Please verify your email by clicking the following link: ${verificationLink}`,
    html: `<p>Please verify your email by clicking the following link:</p><p><a href="${verificationLink}">Verify Email</a></p>`,
  };

  try {
    await sgMail.send(msg);
    console.log('Verification email sent');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
