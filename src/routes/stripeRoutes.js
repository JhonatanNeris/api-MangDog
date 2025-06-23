//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import stripeController from '../controllers/stripeController.js'

//Auth
import autenticarToken from '../middlewares/autenticarToken.js'


const routes = express.Router()

routes.post("/create-checkout-session", stripeController.criarSessaoCheckout)
routes.post("/stripe/criar-conta", autenticarToken, stripeController.criarContaStripeCheckout)
routes.get("/stripe/status-conta", autenticarToken, stripeController.statusContaStripe)
routes.get("/stripe/status-assinatura", autenticarToken, stripeController.getStatusAssinatura)
routes.post("/stripe/create-portal-session", autenticarToken, stripeController.criarPortalSession)
routes.post("/webhook", stripeController.webhook)

export default routes   