import express from "express";

import categorias from "./categoriasRoutes.js";
import produtos from './produtosRoutes.js'
import pedidos from './pedidosRoutes.js'
import usuarios from './usuariosRoutes.js'
import desempenho from './desempenhoRoutes.js'
import clientes from './clienteRoutes.js'
import grupoComplementos from './grupoComplementosRoutes.js'
import stripe from './stripeRoutes.js'
import consumidores from './consumidorRoutes.js'
import cardapioDigital from './cardapioDigitalRoutes.js'
import configuracoes from './configuracoesRoutes.js'
import ifood from './ifoodRoutes.js'

import stripeController from "../controllers/stripeController.js";

const routes = (app) => {
  app.route("/").get((req, res) => res.status(200).send("API Sistema Bruto"));

  // 👇 Middleware especial só para webhook (antes de express.json())
  app.post("/webhook", express.raw({ type: 'application/json' }), stripeController.webhook);


  app.use(express.json(), categorias, produtos, pedidos, usuarios, desempenho, clientes, grupoComplementos, stripe, consumidores, cardapioDigital, configuracoes, ifood);
};

export default routes;