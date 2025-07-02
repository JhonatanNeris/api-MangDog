import express from "express";
import ConfiguracoesController from "../controllers/configuracoesController.js";
import autenticarToken from "../middlewares/autenticarToken.js";

const router = express.Router();

router.get("/configuracoes/:clienteId", ConfiguracoesController.getPorCliente);
router.post("/configuracoes", autenticarToken, ConfiguracoesController.postConfiguracoes);
router.put("/configuracoes", autenticarToken, ConfiguracoesController.putConfiguracoes);

export default router;
