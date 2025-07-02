import mongoose from "mongoose";
import { produto } from "./src/models/Produto.js"; // Caminho correto do modelo de produto
import { categoria } from "./src/models/Categoria.js"; // Caminho correto do modelo de produto
import pedido from "./src/models/Pedido.js"; // Caminho correto do modelo de produto
import cliente from "./src/models/Cliente.js";
import configuracoes from "./src/models/Configuracoes.js";


const clienteId = "67db8d48e70b5cdc794de4b6"; // ID do cliente que você deseja atribuir

// Troque pela string real 
const DB_CONNECTION_STRING = "mongodb+srv://admin:admin123@cluster0.19oy4.mongodb.net/mangDog?retryWrites=true&w=majority&appName=Cluster0"

async function atualizarItens() {
  try {
    if (!DB_CONNECTION_STRING) {
      throw new Error("DB_CONNECTION_STRING não definida.");
    }

    await mongoose.connect(DB_CONNECTION_STRING);

    // buscar todos os clientes
    const clientes = await cliente.find();

    // para cada cliente, verificar se já tem configurações
    for (const c of clientes) {
      const jaTem = await configuracoes.findOne({ clienteId: c._id });
      if (!jaTem) {
        await configuracoes.create({
          clienteId: c._id,
          pedidos: { sequencia: 0 },
          cardapioDigital: {
            cardapioAtivo: false,
            temaCardapio: {},
            pagamento: {
              online: {
                ativo: false,
                formasPagamento: []
              },
              local: {
                ativo: true,
                formasPagamento: []
              }
            }
          },
          horarioFuncionamento: {
            dias: [],
            diasFechadosEspeciais: []
          }
        });
        console.log(`Configuração criada para cliente ${c._id}`);
      }
    }

    console.log(`Cliente atualizado:`);
    mongoose.connection.close();
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    mongoose.connection.close();
  }
}

atualizarItens();