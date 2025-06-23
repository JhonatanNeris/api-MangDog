import mongoose from "mongoose";
import { produto } from "./src/models/Produto.js"; // Caminho correto do modelo de produto
import { categoria } from "./src/models/Categoria.js"; // Caminho correto do modelo de produto
import pedido from "./src/models/Pedido.js"; // Caminho correto do modelo de produto
import cliente from "./src/models/Cliente.js";

const clienteId = "67db8d48e70b5cdc794de4b6"; // ID do cliente que você deseja atribuir

// Troque pela string real 
const DB_CONNECTION_STRING = ""

async function atualizarItens() {
  try {
    if (!DB_CONNECTION_STRING) {
      throw new Error("DB_CONNECTION_STRING não definida.");
    }

    await mongoose.connect(DB_CONNECTION_STRING);

    const resultado = await cliente.findByIdAndUpdate(clienteId, {
      assinaturaAtiva: true,
      stripeCustomerId: "cus_SYIlM7qXYUYHfG",
    });

    console.log(`Cliente atualizado:`, resultado);
    mongoose.connection.close();
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    mongoose.connection.close();
  }
}

atualizarItens();