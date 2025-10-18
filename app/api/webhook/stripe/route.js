import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import configFile from "@/config";
import User from "@/models/User";
import { findCheckoutSession } from "@/libs/stripe";
import { securityMiddleware } from "@/libs/security/index.js";

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Webhook Stripe con middleware di sicurezza completo
export const POST = securityMiddleware.stripeWebhook(async (req) => {
  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    console.error("Stripe non configurato correttamente. Manca STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Configurazione Stripe mancante" }, { status: 500 });
  }

  // Connessione MongoDB sicura
  await connectMongo();

  // Il payload è già verificato dal middleware di sicurezza
  const event = req.webhookPayload;
  const eventType = event.type;

  console.log(`📥 Webhook Stripe ricevuto: ${eventType}`);

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // Primo pagamento completato con successo
        console.log("✅ Checkout completato:", event.data.object.id);

        const session = await findCheckoutSession(event.data.object.id);
        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = event.data.object.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        if (!plan) {
          console.warn("⚠️ Piano non trovato per priceId:", priceId);
          break;
        }

        const customer = await stripe.customers.retrieve(customerId);

        let user;

        // Trova o crea l'utente
        if (userId) {
          user = await User.findById(userId);
          console.log("👤 Utente trovato per ID:", userId);
        } else if (customer.email) {
          user = await User.findOne({ email: customer.email });

          if (!user) {
            user = await User.create({
              email: customer.email,
              name: customer.name,
            });
            await user.save();
            console.log("👤 Nuovo utente creato:", customer.email);
          }
        } else {
          console.error("❌ Nessun utente trovato");
          throw new Error("Nessun utente trovato");
        }

        // Aggiorna dati utente e concedi accesso
        user.priceId = priceId;
        user.customerId = customerId;
        user.hasAccess = true;
        await user.save();

        console.log("✅ Accesso concesso all'utente:", user.email);

        // TODO: Invia email di benvenuto
        // try {
        //   await sendEmail({to: user.email, template: 'welcome'});
        // } catch (e) {
        //   console.error("Errore invio email:", e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // Utente non ha completato la transazione
        console.log("⏰ Checkout scaduto:", event.data.object.id);
        
        // TODO: Invia email di promemoria
        // try {
        //   await sendEmail({to: customer.email, template: 'checkout-reminder'});
        // } catch (e) {
        //   console.error("Errore invio email promemoria:", e?.message);
        // }
        
        break;
      }

      case "customer.subscription.updated": {
        // Il cliente potrebbe aver cambiato piano
        console.log("🔄 Sottoscrizione aggiornata:", event.data.object.id);
        
        const subscription = event.data.object;
        const user = await User.findOne({ customerId: subscription.customer });
        
        if (user) {
          // Aggiorna piano se necessario
          if (subscription.items.data[0]?.price.id !== user.priceId) {
            user.priceId = subscription.items.data[0].price.id;
            await user.save();
            console.log("📝 Piano utente aggiornato:", user.email);
          }
        }
        
        break;
      }

      case "customer.subscription.deleted": {
        // La sottoscrizione del cliente è terminata
        console.log("❌ Sottoscrizione cancellata:", event.data.object.id);
        
        const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
        const user = await User.findOne({ customerId: subscription.customer });

        if (user) {
          // Revoca accesso al prodotto
          user.hasAccess = false;
          await user.save();
          console.log("🚫 Accesso revocato per:", user.email);
          
          // TODO: Invia email di conferma cancellazione
          // try {
          //   await sendEmail({to: user.email, template: 'subscription-cancelled'});
          // } catch (e) {
          //   console.error("Errore invio email cancellazione:", e?.message);
          // }
        }

        break;
      }

      case "invoice.paid": {
        // Il cliente ha appena pagato una fattura (pagamento ricorrente)
        console.log("💰 Fattura pagata:", event.data.object.id);
        
        const priceId = event.data.object.lines.data[0].price.id;
        const customerId = event.data.object.customer;

        const user = await User.findOne({ customerId });

        if (user) {
          // Assicurati che la fattura sia per lo stesso piano
          if (user.priceId !== priceId) {
            console.warn("⚠️ Piano fattura diverso dal piano utente");
            break;
          }

          // Concedi accesso al prodotto
          user.hasAccess = true;
          await user.save();
          console.log("✅ Accesso rinnovato per:", user.email);
        }

        break;
      }

      case "invoice.payment_failed": {
        // Un pagamento è fallito
        console.log("💳 Pagamento fallito:", event.data.object.id);
        
        const customerId = event.data.object.customer;
        const user = await User.findOne({ customerId });

        if (user) {
          // Opzione 1: Revoca accesso immediatamente
          // user.hasAccess = false;
          // await user.save();
          
          // Opzione 2: Aspetta che Stripe provi di nuovo (più friendly)
          console.log("⏳ Aspetto retry automatici di Stripe per:", user.email);
          
          // TODO: Invia email di notifica pagamento fallito
          // try {
          //   await sendEmail({to: user.email, template: 'payment-failed'});
          // } catch (e) {
          //   console.error("Errore invio email pagamento fallito:", e?.message);
          // }
        }

        break;
      }

      default:
        console.log(`❓ Evento non gestito: ${eventType}`);
    }
  } catch (error) {
    console.error(`❌ Errore webhook Stripe (${eventType}):`, error.message);
    
    // In produzione, potresti voler inviare questo errore a un servizio di monitoring
    // await sendToMonitoring({ error: error.message, eventType, event });
    
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    received: true,
    eventType,
    timestamp: new Date().toISOString()
  });
});
