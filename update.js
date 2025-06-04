import mongoose from "mongoose";
import { produto } from "./src/models/Produto.js"; // Caminho correto do modelo de produto
import { categoria } from "./src/models/Categoria.js"; // Caminho correto do modelo de produto
import pedido from "./src/models/Pedido.js"; // Caminho correto do modelo de produto

const clienteId = "67db8d48e70b5cdc794de4b6"; // ID do cliente que você deseja atribuir

const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING

async function atualizarItens() {
    try {
        await mongoose.connect(DB_CONNECTION_STRING);

        const pedidosSemCliente = await pedido.find({ clienteId: { $exists: false } }); // Busca pedidos sem clienteId

        let count = 0;
        
        for (const pedido of pedidosSemCliente) {
            pedido.clienteId = clienteId;
            await pedido.save();
            count++;
        }

        console.log(`Atualizados ${count} pedidos com clienteId.`);
        mongoose.connection.close();
    } catch (error) {
        console.error("Erro ao atualizar pedidos:", error);
        mongoose.connection.close();
    }
}

atualizarItens();
