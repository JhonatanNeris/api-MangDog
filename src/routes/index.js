import express from "express";

import categorias from "./categoriasRoutes.js";
import produtos from './produtosRoutes.js'
import pedidos from './pedidosRoutes.js'
import usuarios from './usuariosRoutes.js'
import desempenho from './desempenhoRoutes.js'
import clientes from './clienteRoutes.js'
import grupoComplementos from './grupoComplementosRoutes.js'

const routes = (app) => {
  app.route("/").get((req, res) => res.status(200).send("API MangDog"));

  app.use(express.json(), categorias, produtos, pedidos, usuarios, desempenho, clientes, grupoComplementos);
};

export default routes;