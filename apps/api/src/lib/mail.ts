import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
});

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${process.env.APP_URL}/verify-email?token=${token}`;
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Verify your Harbor account",
    text: `Verify your email: ${link}\n\nThis link expires in 24 hours.`,
  });
}