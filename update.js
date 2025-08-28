import mongoose from "mongoose";
import { produto } from "./src/models/Produto.js"; // Caminho correto do modelo de produto
import { categoria } from "./src/models/Categoria.js"; // Caminho correto do modelo de produto
import pedido from "./src/models/Pedido.js"; // Caminho correto do modelo de produto
import cliente from "./src/models/Cliente.js";
import configuracoes from "./src/models/Configuracoes.js";


const clienteId = "67db8d48e70b5cdc794de4b6"; // ID do cliente que você deseja atribuir

// Troque pela string real 
const DB_CONNECTION_STRING = ""

async function atualizarProdutos() {
  try {
    if (!DB_CONNECTION_STRING) {
      throw new Error("DB_CONNECTION_STRING não definida.");
    }

    await mongoose.connect(DB_CONNECTION_STRING);

    // Atualiza todos os produtos que ainda não possuem os novos campos
    const resultado = await produto.updateMany(
      {
        $or: [
          { controlaEstoque: { $exists: false } },
          { quantidadeEstoque: { $exists: false } }
        ]
      },
      {
        $set: {
          controlaEstoque: false,
          quantidadeEstoque: 0
        }
      }
    );

    console.log(`Produtos atualizados: ${resultado.modifiedCount}`);
    mongoose.connection.close();
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    mongoose.connection.close();
  }
}

atualizarProdutos();