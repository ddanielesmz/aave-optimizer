// libs/auth.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import EmailProvider from "next-auth/providers/email"; // Disabilitato per edge runtime
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "./mongo"; // il tuo helper per connettere MongoDB (libs/mongo.js)
import User from "../models/User"; // modello User (assumendo models/User.js)

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
        if (!credentials || !credentials.email) return null;

        // Solo se MongoDB è configurato
        if (!process.env.MONGODB_URI) {
          console.warn('MONGODB_URI not configured, skipping database authentication');
          return null;
        }

        try {
          // Connessione diretta a MongoDB usando mongoose
          if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
          }

          // Recupera utente (assumendo che la password sia salvata hashed)
          const user = await User.findOne({ email: credentials.email }).select("+password");
          if (!user) return null;

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
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Gestisce il login OAuth (Google) - VERSIONE SEMPLIFICATA PER DEBUG
    async signIn({ user, account, profile }) {
      console.log('🔍 SignIn callback called:', {
        provider: account?.provider,
        email: user?.email,
        name: user?.name
      });
      
      if (account?.provider === "google") {
        console.log('Google OAuth detected, allowing access');
        return true; // Permetti sempre l'accesso per ora
      }
      
      console.log('Other provider or no provider, allowing access');
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
