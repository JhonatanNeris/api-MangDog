import express from "express";

import categorias from "./categoriasRoutes.js";
import produtos from './produtosRoutes.js'
import pedidos from './pedidosRoutes.js'

const routes = (app) => {
  app.route("/").get((req, res) => res.status(200).send("API MangDog"));

  app.use(express.json(), categorias, produtos, pedidos);
};

export default routes;