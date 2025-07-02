//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import CardapioDigitalController from '../controllers/cardapioDigitalController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/cardapio-digital/restaurante/:slug", CardapioDigitalController.getRestaurante)
routes.post("/cardapio-digital/novo-pedido/:slug", CardapioDigitalController.criarPedido);


export default routes