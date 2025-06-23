import mongoose from "mongoose";
import { produto } from "./src/models/Produto.js"; // Caminho correto do modelo de produto
import { categoria } from "./src/models/Categoria.js"; // Caminho correto do modelo de produto
import pedido from "./src/models/Pedido.js"; // Caminho correto do modelo de produto
import cliente from "./src/models/Cliente.js";

const clienteId = "67db8d48e70b5cdc794de4b6"; // ID do cliente que você deseja atribuir

const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING 

function gerarSlug(nome) {
    return nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function atualizarItens() {
    try {
        await mongoose.connect(DB_CONNECTION_STRING);

        const clientesSemSlug = await cliente.find({ slug: { $exists: false } }); // Busca clientes sem slug

        let count = 0;

        for (const cliente of clientesSemSlug) {

            let slug = gerarSlug(cliente.nome);  
            cliente.slug = slug;
            await cliente.save();
            count++;
        }

        console.log(`Atualizados ${count} clientes com slug.`);
        mongoose.connection.close();
    } catch (error) {
        console.error("Erro ao atualizar pedidos:", error);
        mongoose.connection.close();
    }
}

atualizarItens();
