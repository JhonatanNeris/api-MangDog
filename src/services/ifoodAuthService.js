import { cliente } from '../models/index.js';
import axios from 'axios';
import qs from 'qs';

export async function getAccessTokenValido(clienteId) {
    const c = await cliente.findById(clienteId);
    if (!c || !c.integracaoIfood) throw new Error('Cliente sem integração iFood');

    const expirado = new Date() > new Date(c.integracaoIfood.tokenExpiresAt);
    if (!expirado) return c.integracaoIfood.accessToken;

    // Token expirado → fazer refresh
    const body = qs.stringify({
        grantType: 'refresh_token',
        clientId: process.env.IFOOD_CLIENT_ID,
        clientSecret: process.env.IFOOD_CLIENT_SECRET,
        refreshToken: c.integracaoIfood.refreshToken
    });

    const res = await axios.post(`${process.env.IFOOD_URL}/authentication/v1.0/oauth/token`, body, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
    });

    const { accessToken, refreshToken, expiresIn } = res.data;

    c.integracaoIfood.accessToken = accessToken;
    c.integracaoIfood.refreshToken = refreshToken;
    c.integracaoIfood.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    await c.save();

    return accessToken;
}
