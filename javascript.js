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
        <td><input class="item-nome" placeholder="Produto A"></td>
        <td><input class="qtd" type="number" placeholder="1"></td>
        <td><input class="desc" placeholder="Descrição"></td>
        <td><input class="preco" type="number" placeholder="0"></td>
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


/* ============================================
   PDF COM PAGINAÇÃO (NOVO BLOCO)
   ============================================ */

document.getElementById("btn_pdf").addEventListener("click", async () => {
    document.body.classList.add("pdf-mode");

    const { jsPDF } = jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const linhas = document.querySelectorAll("#itens_body tr");
    const pageHeight = 297;
    let y = 20;

    // Cabeçalho simples
    pdf.setFontSize(14);
    pdf.text("Orçamento", 20, y);
    y += 10;

    // Lista de itens linha por linha
    linhas.forEach((tr, index) => {
        const texto = [...tr.querySelectorAll("td")]
            .slice(0, 5) // Pega só as colunas úteis
            .map(td => td.innerText.trim())
            .join("   |   ");

        pdf.setFontSize(11);

        // Quebra de página automática
        if (y > pageHeight - 20) {
            pdf.addPage();
            y = 20;
        }

        pdf.text(texto, 20, y);
        y += 7;
    });

    // Totais
    y += 10;
    pdf.setFontSize(13);
    pdf.text("Total: R$ " + document.getElementById("total").innerText, 20, y);

    pdf.save("orcamento.pdf");
    document.body.classList.remove("pdf-mode");
});



/* ============================================
   IMPRESSÃO A4
   ============================================ */

document.getElementById("btn_print").addEventListener("click", () => {
    const invoice = document.getElementById("invoice");

    document.body.classList.add("print-mode");

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
