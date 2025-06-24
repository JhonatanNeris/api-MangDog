import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});

import cliente from '../models/Cliente.js';

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

    static async criarContaStripeCheckout(req, res, next) {

        const clienteId = req.usuario.clienteId;

        if (!clienteId) return res.status(401).json({ erro: "Não autenticado" });

        try {

            const restaurante = await cliente.findById(clienteId);
            if (!restaurante) return res.status(404).json({ erro: "Restaurante não encontrado" });

            console.log(restaurante)

            let stripeAccountId = restaurante.stripeAccountId;

            // 1. Criar conta se não existir
            if (!stripeAccountId) {
                const account = await stripe.accounts.create({
                    type: 'express',
                    country: 'BR',
                    email: restaurante.emailContato,
                    capabilities: {
                        transfers: { requested: true },
                        card_payments: { requested: true },
                    },
                });

                stripeAccountId = account.id;

                // 2. Salvar no banco
                restaurante.stripeAccountId = stripeAccountId;
                await restaurante.save();
            }

            // 3. Criar link de onboarding
            const accountLink = await stripe.accountLinks.create({
                account: stripeAccountId,
                refresh_url: `${process.env.FRONTEND_URL}/admin/configuracoes/pagamento`,
                return_url: `${process.env.FRONTEND_URL}/admin/configuracoes/pagamento`,
                type: 'account_onboarding',
            });

            return res.json({ url: accountLink.url });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar conta Stripe' });
        }


    }

    static async statusContaStripe(req, res, next) {
        const clienteId = req.usuario.clienteId;

        if (!clienteId) {
            return res.status(401).json({ erro: "Não autenticado" });
        }

        const restaurante = await cliente.findById(clienteId);

        if (!restaurante) {
            return res.status(404).json({ erro: "Restaurante não encontrado" });
        }

        if (!restaurante.stripeAccountId) {
            return res.json({ status: 'nao-criado' });
        }

        const account = await stripe.accounts.retrieve(restaurante.stripeAccountId);

        if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
            return res.json({ status: 'completo' });
        } else {
            return res.json({ status: 'pendente' });
        }
    }

    static async getStatusAssinatura(req, res, next) {
        try {
            const clienteId = req.usuario?.clienteId;

            if (!clienteId) {
                return res.status(400).json({ erro: 'Cliente não identificado.' });
            }

            const clienteEncontrado = await cliente.findById(clienteId);
            if (!clienteEncontrado || !clienteEncontrado.stripeCustomerId) {
                return res.status(404).json({ erro: 'Cliente não encontrado ou sem stripeCustomerId.' });
            }

            const subscriptions = await stripe.subscriptions.list({
                customer: clienteEncontrado.stripeCustomerId,
                status: 'all',
                limit: 1,
            });


            if (!subscriptions.data.length) {
                return res.status(404).json({ erro: 'Nenhuma assinatura encontrada.' });
            }

            const subscription = subscriptions.data[0];

            if (!subscription.default_payment_method) {
                return res.status(400).json({ erro: 'Assinatura sem método de pagamento.' });
            }

            const paymentMethod = await stripe.paymentMethods.retrieve(
                subscription.default_payment_method
            );   
            
            const product = await stripe.products.retrieve(subscription.items.data[0].price.product);
            
            const dadosAssinatura = {
                status: subscription.status,
                proximaCobranca: new Date(subscription.current_period_end * 1000),
                valor: subscription.items.data[0].price.unit_amount / 100,
                moeda: subscription.items.data[0].price.currency,
                plano: product.name,
                cartao: {
                    marca: paymentMethod.card.brand,
                    ultimos4: paymentMethod.card.last4,
                    vencimento: `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`,
                },
            };

            console.log(dadosAssinatura)

            res.json({
                ativa: subscription.status === 'active',
                dadosAssinatura,
            });
        } catch (error) {
            console.error('❌ Erro em getStatusAssinatura:', error);
            next(error);
        }
    }


    static async criarPortalSession(req, res, next) {
        try {
            const clienteId = req.usuario?.clienteId;

            if (!clienteId) {
                return res.status(400).json({ erro: 'Cliente não autenticado.' });
            }

            const clienteEncontrado = await cliente.findById(clienteId);

            if (!clienteEncontrado || !clienteEncontrado.stripeCustomerId) {
                return res.status(404).json({ erro: 'Cliente não possui stripeCustomerId.' });
            }

            console.log(clienteEncontrado.stripeCustomerId)

            const session = await stripe.billingPortal.sessions.create({
                customer: clienteEncontrado.stripeCustomerId,
                // return_url: process.env.RETURN_URL_PORTAL || 'https://sistema-bruto.vercel.app/',
                return_url: 'https://sistema-bruto.vercel.app/',
            });

            res.json({ url: session.url });
        } catch (error) {
            console.log("passou pelo controler...")
            next(error);
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

        if (event.type === 'account.updated') {
            const account = event.data.object;

            const accountId = account.id;

            // Você pode checar se o onboarding foi concluído com sucesso
            if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
                try {
                    // Atualize o restaurante no banco
                    await cliente.findOneAndUpdate(
                        { stripeAccountId: accountId },
                        { stripeStatus: 'completo' }
                    );

                    console.log(`✅ Conta Stripe ${accountId} ativada com sucesso`);
                } catch (err) {
                    console.error(`Erro ao atualizar conta Stripe: ${err}`);
                }
            } else {
                // Status incompleto ou pendente
                await cliente.findOneAndUpdate(
                    { stripeAccountId: accountId },
                    { stripeStatus: 'pendente' }
                );
                console.log(`⚠️ Conta Stripe ${accountId} ainda pendente`);
            }
        }

        res.status(200).json({ received: true });

    }

}

export default stripeController;