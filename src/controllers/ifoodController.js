import axios from 'axios';
import qs from 'qs'; // Para formatar x-www-form-urlencoded
import { cliente, pedido } from '../models/index.js';
import { getAccessTokenValido } from '../services/ifoodAuthService.js';
import { mapearPedidoIfoodParaIPedido } from '../utils/mapearPedidoIfood.js';

const IFOOD_URL = process.env.IFOOD_URL
const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET

class IfoodController {
    static async postUserCode(req, res, next) {
        try {
            const url = `${IFOOD_URL}/authentication/v1.0/oauth/userCode`
            console.log(url)

            const body = qs.stringify({
                clientId: process.env.IFOOD_CLIENT_ID
            });

            const response = await axios.post(url,
                body,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log(response.data)

            const { userCode, authorizationCodeVerifier, verificationUrl, verificationUrlComplete, expiresIn } = response.data

            res.status(200).json({
                userCode,
                authorizationCodeVerifier,
                verificationUrl,
                verificationUrlComplete,
                expiresIn
            });

        } catch (error) {
            console.error("Erro gerar url de autorização:", error);

        }
    }

    static async postToken(req, res, next) {
        try {
            const url = `${IFOOD_URL}/authentication/v1.0/oauth/token`
            console.log(url)

            const body = qs.stringify({
                clientId: process.env.IFOOD_CLIENT_ID,
                clientSecret: process.env.IFOOD_CLIENT_SECRET,
                grantType: req.body.grantType,
                authorizationCode: req.body.authorizationCode,
                authorizationCodeVerifier: req.body.authorizationCodeVerifier
            });

            const response = await axios.post(url,
                body,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log(response.data)

            const { accessToken, refreshToken, type, expiresIn } = response.data

            const clienteId = req.usuario.clienteId

            const clienteEncontrado = await cliente.findById(clienteId);
            if (!clienteEncontrado) return res.status(404).json({ erro: 'Cliente não encontrado' });

            clienteEncontrado.integracaoIfood = {
                ativo: true,
                accessToken: accessToken,
                refreshToken: refreshToken,
                tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            };

            await clienteEncontrado.save();

            res.status(200).json({ mensagem: 'Integração com iFood concluída com sucesso' });

        } catch (error) {
            console.error("Erro gerar url de autorização:", error);
            res.status(500).json({ erro: 'Erro ao integrar com o iFood' });

        }
    }

    static async refreshToken(req, res, next) {

        const clienteId = req.usuario.clienteId

        const clienteEncontrado = await cliente.findById(clienteId);

        if (!clienteEncontrado) return res.status(404).json({ erro: 'Cliente não encontrado' });

        try {
            const url = `${IFOOD_URL}/authentication/v1.0/oauth/token`
            console.log(url)

            const body = qs.stringify({
                clientId: IFOOD_CLIENT_ID,
                clientSecret: IFOOD_CLIENT_SECRET,
                grantType: 'refresh_token',
                refreshToken: clienteEncontrado.integracaoIfood.refreshToken
            });

            const response = await axios.post(url,
                body,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log(response.data)

            const { accessToken, refreshToken, type, expiresIn } = response.data

            clienteEncontrado.integracaoIfood.accessToken = accessToken;
            clienteEncontrado.integracaoIfood.refreshToken = refreshToken;
            clienteEncontrado.integracaoIfood.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

            await clienteEncontrado.save();

            res.status(200).json(accessToken);

        } catch (error) {
            console.error("Erro gerar url de autorização:", error);
            res.status(500).json({ erro: 'Erro ao integrar com o iFood' });

        }
    }

    static async pollingEvents(req, res, next) {

        try {
            const clienteId = req.usuario.clienteId

            const clienteEncontrado = await cliente.findById(clienteId);

            if (!clienteEncontrado) return res.status(404).json({ erro: 'Cliente não encontrado' });

            const url = `${IFOOD_URL}/events/v1.0/events:polling`

            const token = await getAccessTokenValido(clienteId);

            // 1. Buscar eventos
            const eventsResponse = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Aqui deu bom")


            const events = eventsResponse.data;
            if (!Array.isArray(events) || events.length === 0) {
                return res.status(200).json({ mensagem: 'Nenhum evento novo encontrado' });
            }

            console.log("Aqui deu bom")

            const pedidosSalvos = [];

            for (const event of events) {
                if (!event.orderId) continue;

                console.log(event)

                const orderResponse = await axios.get(`https://merchant-api.ifood.com.br/order/v1.0/orders/${event.orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Aqui deu ruim")

                const pedidoIfood = orderResponse.data;
                const pedidoConvertido = mapearPedidoIfoodParaIPedido(pedidoIfood, clienteId);
                const jaExiste = await pedido.findOne({ idExterno: pedidoIfood.id });

                console.log(pedidoIfood)
                console.log(pedidoConvertido)

                if (!jaExiste) {

                    console.log("SALVAR PEDIDO")
                    // const novo = await pedido.create(pedidoConvertido);
                    // pedidosSalvos.push(novo);
                }
            }

            // 2. Dar acknowledgment
            // const eventIds = events.map(e => e.id);
            // await axios.post('https://merchant-api.ifood.com.br/events/v1.0/acknowledgment',
            //     { eventIds },
            //     { headers: { Authorization: `Bearer ${token}` } }
            // );

            res.status(200).json({ pedidos: pedidosSalvos });

        } catch (error) {
            console.error("Erro gerar url de autorização:");
            res.status(500).json({ erro: 'Erro ao integrar com o iFood' });

        }
    }
}

export default IfoodController;