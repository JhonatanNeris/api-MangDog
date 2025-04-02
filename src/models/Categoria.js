import mongoose from "mongoose"

const categoriaSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: [true, 'O nome da categoria é obrigatório.'] },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true }, 
}, { versionKey: false });

const categoria = mongoose.model("categorias", categoriaSchema);

export { categoria, categoriaSchema };