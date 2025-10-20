import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// This route is used to store the leads that are generated from the landing page.
// The API call is initiated by <ButtonLead /> component
// Duplicate emails just return 200 OK
export async function POST(req) {
  try {
    await connectMongo();
  } catch (error) {
    console.warn("[Lead API] MongoDB connection unavailable:", error.message);
  }

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  try {
    // Here you can add your own logic
    // For instance, sending a welcome email (use the the sendEmail helper function from /libs/resend)
    // For instance, saving the lead in the database (uncomment the code below)

    // const lead = await Lead.findOne({ email: body.email });

    // if (!lead) {
    // 	await Lead.create({ email: body.email });
    // }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
