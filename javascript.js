document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").innerText =
    new Date().toLocaleDateString("pt-BR");
});

let id_item = 1;

function atualizarTotais() {
  let subtotal = 0;

  document.querySelectorAll(".linha-item").forEach(row => {
    const qtd = parseFloat(row.querySelector(".qtd").value) || 0;
    const preco = parseFloat(row.querySelector(".preco").value) || 0;

    const total = qtd * preco;
    row.querySelector(".total-item").innerText = total.toFixed(2);

    subtotal += total;
  });

  document.getElementById("subtotal").innerText = subtotal.toFixed(2);
  document.getElementById("total").innerText = subtotal.toFixed(2);
}

document.getElementById("btn_add").addEventListener("click", () => {
  const tbody = document.getElementById("itens_body");

  const tr = document.createElement("tr");
  tr.className = "linha-item";

  tr.innerHTML = `
    <td><input class="item-nome" value="Produto A"></td>
    <td><input class="qtd" type="number" value="1"></td>
    <td><input class="desc" placeholder="Descrição"></td>
    <td><input class="preco" type="number" value="0"></td>
    <td>R$ <span class="total-item">0.00</span></td>
    <td><button class="btn btn-gray btn-del">X</button></td>
  `;

  tbody.appendChild(tr);
  id_item++;

  tr.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", atualizarTotais);
  });

  tr.querySelector(".btn-del").addEventListener("click", () => {
    tr.remove();
    atualizarTotais();
  });

  atualizarTotais();
});

document.getElementById("btn_reset").addEventListener("click", () => {
  document.getElementById("itens_body").innerHTML = "";
  atualizarTotais();
});

/* PDF DEFINITIVO */
document.getElementById("btn_pdf").addEventListener("click", async () => {
  const invoice = document.getElementById("invoice");
  document.body.classList.add("pdf-mode");

  await new Promise(r => setTimeout(r, 300));

  const canvas = await html2canvas(invoice, { scale: 2 });
  document.body.classList.remove("pdf-mode");

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jspdf.jsPDF("p", "pt", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
  pdf.save("orcamento.pdf");
});

/* IMPRESSÃO A4 */
document.getElementById("btn_print").addEventListener("click", () => {
  const invoice = document.getElementById("invoice");

  // Adiciona classe especial para impressão
  document.body.classList.add("print-mode");

  // Garante que o layout está atualizado antes de abrir o print
  setTimeout(() => {
    window.print();
    document.body.classList.remove("print-mode");
  }, 300);
});


/* WHATSAPP */
document.getElementById("btn_whatsapp").addEventListener("click", () => {
  const cliente = document.getElementById("cliente_nome").value;
  const total = document.getElementById("total").innerText;

  const texto = `Olá ${cliente}, seu orçamento ficou em R$ ${total}.`;

  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`);
});
