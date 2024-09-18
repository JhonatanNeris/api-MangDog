import mongoose from "mongoose"

const categoriaSchema = new mongoose.Schema ({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: [true, 'O nome da categoria é obrigatório.'] }
}, { versionKey: false });

const categoria = mongoose.model("categorias", categoriaSchema);

export { categoria, categoriaSchema } ;