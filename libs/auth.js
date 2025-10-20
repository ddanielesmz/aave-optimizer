// libs/auth.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import EmailProvider from "next-auth/providers/email"; // Disabilitato per edge runtime
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectMongo from "./mongoose";

const authSecret = process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error(
    "NEXTAUTH_SECRET must be defined. Generate a strong value and set it in the environment before starting the app.",
  );
}

const allowedGoogleDomain = process.env.NEXTAUTH_GOOGLE_ALLOWED_DOMAIN?.toLowerCase();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Configurazione per NextAuth v5
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // 1) Credentials: email + password (classic form)
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials || typeof credentials.email !== "string" || typeof credentials.password !== "string") {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        if (!emailRegex.test(email) || credentials.password.length < 1) {
          return null;
        }

        // Solo se MongoDB è configurato
        if (!process.env.MONGODB_URI) {
          console.warn('MONGODB_URI not configured, skipping database authentication');
          return null;
        }

        try {
          // Connessione diretta a MongoDB usando mongoose
          if (mongoose.connection.readyState !== 1) {
            await connectMongo();
          }

          // Dynamic import per evitare problemi con middleware
          const { default: User } = await import("../models/User");

          // Recupera utente (assumendo che la password sia salvata hashed)
          const user = await User.findOne({ email }).select("+password");
          if (!user?.password) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          // NextAuth si aspetta un oggetto user (id, email, name...)
          return { id: user._id.toString(), email: user.email, name: user.name || user.email };
        } catch (error) {
          console.error('Database authentication error:', error);
          return null;
        }
      },
    }),

    // 2) Google OAuth (solo se configurato)
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
      })
    ] : []),

    // 3) Email provider (magic link) - DISABILITATO per evitare problemi con edge runtime
    // ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM ? [
    //   EmailProvider({
    //     server: process.env.EMAIL_SERVER,
    //     from: process.env.EMAIL_FROM,
    //   })
    // ] : []),
  ],

  // impostazioni generali
  secret: authSecret,
  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Gestisce il login OAuth (Google)
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (allowedGoogleDomain) {
          const emailDomain = user?.email?.split("@")[1]?.toLowerCase();

          if (!emailDomain || emailDomain !== allowedGoogleDomain) {
            console.warn('[NextAuth] Blocked Google sign-in attempt due to unauthorized domain');
            return false;
          }
        }
        return true;
      }
      return true;
    },
    
    // salva user nel token
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    
    // nella session restituisce session.user
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },
  },

  // opzionale: se hai una pagina di signin custom cambiala qui
  // pages: { signIn: "/signin" },
});
