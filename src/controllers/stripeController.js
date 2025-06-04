import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});

import cliente  from '../models/Cliente.js';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

class stripeController {

    static async criarSessaoCheckout(req, res, next) {

        const { clienteId, priceId, email } = req.body

        try {
            
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer_email: email,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId, // Substitua pelo ID do preço da Stripe
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso`,
                cancel_url: `${process.env.FRONTEND_URL}/assinatura/cancelada`,
                metadata: {
                    clienteId,
                    email
                },
            });

            res.json({ url: session.url });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
        }

    }

    static async webhook(req, res, next) {
        const sig = req.headers['stripe-signature'];

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error(`⚠️ Erro no webhook: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // 🔍 Log básico do evento
        console.log('💥 Evento recebido:', event);
        console.log('💥 Evento recebido:', event.type);

        // 🎯 Trate apenas eventos relevantes
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            const customerId = session.customer;

            const clienteId = session.metadata?.clienteId;

            // Aqui você marca o cliente como ativo no seu banco
            try {
                await cliente.findByIdAndUpdate(clienteId, {
                    ativo: true,
                    stripeCustomerId: customerId
                });
                console.log(`✅ Cliente ${clienteId} ativado com sucesso.`);
            } catch (err) {
                console.error(`Erro ao ativar cliente: ${err}`);
            }
        }

        res.status(200).json({ received: true });


    }

}

export default stripeController;