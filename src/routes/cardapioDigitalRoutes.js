//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import CardapioDigitalController from '../controllers/cardapioDigitalController.js'

//MIDDLEWARES
import { autenticarConsumidor } from '../middlewares/autenticarTokenConsumidor.js'


const routes = express.Router()

routes.get("/cardapio-digital/restaurante/:slug", CardapioDigitalController.getRestaurante)
routes.post("/cardapio-digital/novo-pedido/:slug", autenticarConsumidor, CardapioDigitalController.criarPedido);


export default routes