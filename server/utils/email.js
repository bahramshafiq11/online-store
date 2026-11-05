import nodemailer from "nodemailer";

let transporterPromise = null;

// Use real email settings from .env if they exist,
// otherwise use a free Ethereal test inbox
const getTransporter = () => {
  if (!transporterPromise) {
    if (process.env.SMTP_HOST) {
      transporterPromise = Promise.resolve(
        nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
      );
    } else {
      transporterPromise = nodemailer
        .createTestAccount()
        .then((account) => {
          console.log("No SMTP settings found. Using Ethereal test inbox for emails.");
          return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: { user: account.user, pass: account.pass },
          });
        })
        .catch((err) => {
          transporterPromise = null; // try again next time
          throw err;
        });
    }
  }
  return transporterPromise;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"MyStore" <no-reply@mystore.test>',
    to,
    subject,
    html,
  });

  // With Ethereal, print a link to view the email
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`Email preview: ${previewUrl}`);

  return info;
};

// Send without waiting. If it fails, log it but never break the request.
export const sendEmailInBackground = (to, email) => {
  if (!email) return;
  sendEmail({ to, ...email }).catch((err) =>
    console.error(`Email to ${to} failed:`, err.message)
  );
};