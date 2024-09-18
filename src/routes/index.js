import express from "express";

import categorias from "./categoriasRoutes.js";
import produtos from './produtosRoutes.js'
import pedidos from './pedidosRoutes.js'
import usuarios from './usuariosRoutes.js'

const routes = (app) => {
  app.route("/").get((req, res) => res.status(200).send("API MangDog"));

  app.use(express.json(), categorias, produtos, pedidos, usuarios);
};

export default routes;