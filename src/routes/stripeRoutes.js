//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import stripeController from '../controllers/stripeController.js'

//Auth
import autenticarToken from '../middlewares/autenticarToken.js'


const routes = express.Router()

routes.post("/create-checkout-session", stripeController.criarSessaoCheckout)
routes.post("/stripe/criar-conta", autenticarToken, stripeController.criarContaStripeCheckout)
routes.get("/stripe/status", autenticarToken, stripeController.statusContaStripe)
routes.post("/webhook", stripeController.webhook)

export default routes   