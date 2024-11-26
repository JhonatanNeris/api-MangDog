import { printer as ThermalPrinter, types as PrinterTypes } from "node-thermal-printer";

// Configurar a impressora com o tipo e a interface USB correta
const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,  // Use STAR se for uma impressora Star
  interface: '\\\\localhost\\EPSON TM-T20X Receipt', // Substitua pelo ID da sua impressora
  removeSpecialCharacters: false,  // Permite caracteres especiais
  characterSet: "PC437_USA",  // Configuração de conjunto de caracteres
});

export const printText = async (pedido) => {
  try {

    printer.alignLeft();

    // Imprimir informações
    printer.println(`Cliente: ${pedido.nomeCliente}`);
    printer.println(`Tipo de Pedido: ${pedido.tipoPedido}`);
    printer.println(`Forma de Pagamento: ${pedido.formaPagamento}\n`);

    printer.drawLine();    

    printer.alignCenter();        
    printer.println(`ITENS DO PEDIDO\n`)

    printer.alignLeft()

     // Imprimir os itens do pedido
    pedido.itens.forEach(item => {
      printer.leftRight(`${item.quantidade} ${item.nome}`, `R$ ${item.precoTotal.toFixed(2)}`);
      
      if (item.adicionais.length > 0) {
        item.adicionais.forEach(adicional => {
          printer.println(`${' '.padStart(4)}${adicional.quantidade}x ${adicional.nome}`);
        });
      }

      if(item.obs){
        printer.println(`Obs: ${item.obs}`)
      }

      printer.println("\n")
    });

    printer.drawLine();    

    // Imprimir o total
    printer.println(`\nVALOR TOTAL: R$ ${pedido.valorTotal.toFixed(2)}`);    
   
    // Comando de corte
    printer.cut();
    // Finaliza a impressão
    await printer.execute();
    //Limpar o buffer
    printer.clear()

    console.log("Pedido impresso com sucesso!");
  } catch (error) {
    console.error("Erro ao imprimir o pedido:", error);
  }
};
