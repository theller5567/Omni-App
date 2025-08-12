import sgMail from '@sendgrid/mail';

/**
 * Sends an invitation email to a user
 * @param {string} email - The recipient's email address
 * @param {string} firstName - The recipient's first name
 * @param {string} lastName - The recipient's last name
 * @param {string} inviterName - The name of the person sending the invitation
 * @param {string} invitationLink - The link to accept the invitation
 * @param {string} role - The role being assigned to the user
 * @param {string} message - Optional custom message from the inviter
 * @returns {Promise<void>}
 */
export async function sendInvitationEmail(email, firstName, lastName, inviterName, invitationLink, role, message = '') {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not set');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Format role for display (capitalize first letter)
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

  // Create HTML email template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">You've Been Invited to Omni's Media Library</h2>
      
      <p>Hello ${firstName} ${lastName},</p>
      
      <p><strong>${inviterName}</strong> has invited you to join Omni's Media Library as a <strong>${formattedRole}</strong>.</p>
      
      ${message ? `<p><strong>Message from ${inviterName}:</strong> "${message}"</p>` : ''}
      
      <p>Please click the button below to accept this invitation and create your account:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${invitationLink}" style="background-color: #4dabf5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
      </div>
      
      <p>This invitation will expire in 7 days.</p>
      
      <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #666;">${invitationLink}</p>
      
      <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
        If you believe this invitation was sent to you by mistake, please disregard this email.
      </p>
    </div>
  `;

  const fromAddress = process.env.EMAIL_FROM || process.env.SENDGRID_FROM;
  const mailOptions = {
    from: { email: fromAddress, name: 'Omni Media Library' },
    to: email,
    subject: 'Invitation to Join Omni Media Library',
    text: `Hello ${firstName} ${lastName},\n\n${inviterName} has invited you to join Omni's Media Library as a ${formattedRole}.\n\n${message ? `Message from ${inviterName}: "${message}"` : ''}\n\nPlease click the following link to accept this invitation and create your account: ${invitationLink}\n\nThis invitation will expire in 7 days.\n\nIf you believe this invitation was sent to you by mistake, please disregard this email.`,
    html: htmlContent
  };

  try {
    await sgMail.send(mailOptions);
    console.log(`Invitation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
} 