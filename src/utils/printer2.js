import escpos from "escpos";
import escposUSB from "escpos-usb";

// Configurando o driver USB
escpos.USB = escposUSB;

// Função para imprimir texto
export const printText = async (text) => {
  try {
    // Inicializando o dispositivo com idVendor e idProduct
    const device = new escpos.USB(1208, 3623);
    const printer = new escpos.Printer(device);

    // Abrindo o dispositivo e imprimindo
    await new Promise((resolve, reject) => {
      device.open((error) => {
        if (error) return reject(error);

        printer.text(text);
        printer.cut();
        printer.close();
        resolve();
      });
    });

    console.log("Impressão realizada com sucesso!");
  } catch (error) {
    console.error("Erro ao imprimir:", error);
    throw error;
  }
};
