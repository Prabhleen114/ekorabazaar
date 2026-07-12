import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, handle, category, description, email, isCreator, isWholesale, source } = body;

    // Check required fields based on the source
    if (source === "why-ekora-page") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
    } else {
      if (!name || !handle || !category) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    }

    const leadData = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || "N/A",
      handle: handle || "N/A",
      category: category || "N/A",
      description: description || "N/A",
      email: email || "N/A",
      isCreator: isCreator !== undefined ? isCreator : true,
      isWholesale: isWholesale !== undefined ? isWholesale : false,
      source: source || "start-selling-page",
      timestamp: new Date().toISOString(),
    };

    // 1. Save locally to applications.json so no leads are lost
    try {
      const filePath = path.join(process.cwd(), "applications.json");
      let currentApps = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        currentApps = JSON.parse(fileContent || "[]");
      }
      currentApps.push(leadData);
      fs.writeFileSync(filePath, JSON.stringify(currentApps, null, 2), "utf-8");
    } catch (fsErr) {
      console.error("Failed to write to local applications.json:", fsErr);
    }

    // 2. Try sending email via Nodemailer if SMTP config is present
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const subject = `New Ekora Application: ${leadData.name || leadData.email}`;
        const textContent = `
New Application Received:
---------------------------
Source: ${leadData.source}
Name: ${leadData.name}
Instagram: ${leadData.handle}
Category: ${leadData.category}
Email: ${leadData.email}
Creator Interest: ${leadData.isCreator ? "Yes" : "No"}
Wholesale Interest: ${leadData.isWholesale ? "Yes" : "No"}
Description: ${leadData.description}
Timestamp: ${leadData.timestamp}
        `;

        await transporter.sendMail({
          from: `"Ekora Forms" <${smtpUser}>`,
          to: "ekoratech@gmail.com",
          subject: subject,
          text: textContent,
        });
      } catch (mailErr) {
        console.error("Nodemailer failed to send email:", mailErr);
      }
    } else {
      console.warn("SMTP_USER and SMTP_PASS environment variables are missing. Skipping email send (saved locally & logged to console).");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Application API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
