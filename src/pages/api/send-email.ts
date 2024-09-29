export const prerender = false;

import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

// Define the mail transporter using your SMTP settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: import.meta.env.EMAIL_USER,
    pass: import.meta.env.EMAIL_PASSWORD,
  },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Try parsing the request body
    const body = await request.json();

    // Send the email using the parsed data
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: body.to,
      subject: body.subject,
      text: body.text, // Plain text version of the email (optional)
      html: body.html, // HTML version of the email
    });

    return new Response(
      JSON.stringify({ message: "Email sent successfully", info }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ message: "Error sending email", error }),
      { status: 500 }
    );
  }
};
