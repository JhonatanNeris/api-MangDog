//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import stripeController from '../controllers/stripeController.js'

const routes = express.Router()

routes.post("/create-checkout-session", stripeController.criarSessaoCheckout)
routes.post("/webhook", stripeController.webhook)

export default routes