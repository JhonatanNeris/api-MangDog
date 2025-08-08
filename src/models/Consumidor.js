import mongoose from "mongoose"

const ConsumidorSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: false },
    documentNumber: { type: String, required: false }, // cpf
    telefone: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    address: {
        streetName: { type: String, required: true },
        streetNumber: { type: String, required: true },
        neighborhood: { type: String, required: true },
        complement: { type: String, required: true },
        reference: { type: String },
        postalCode: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
}, { versionKey: false, timestamps: true });

const consumidor = mongoose.model("consumidores", ConsumidorSchema);

export default consumidor;
