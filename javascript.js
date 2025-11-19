document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("data").innerText =
        new Date().toLocaleDateString("pt-BR");
});

let id_item = 1;

function atualizarTotais() {
    let subtotal = 0;

    document.querySelectorAll(".linha-item").forEach(row => {
        // Usa `|| 0` para garantir que campos vazios sejam tratados como zero
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

                   /* PDF DEFINITIVO (CORRIGIDO PARA PAGINAÇÃO E MODO CELULAR) */

document.getElementById("btn_pdf").addEventListener("click", async () => {
    const invoice = document.getElementById("invoice");
    document.body.classList.add("pdf-mode");

    // 🌟 NOVO: PREPARAÇÃO DO LAYOUT PARA CAPTURA
    // Substitui todos os inputs da tabela por elementos <span> com seu valor
    document.querySelectorAll("#itens_body .linha-item").forEach(row => {
        // Itera sobre todas as colunas de dados (Item, Qtd, Desc, Preco)
        row.querySelectorAll('td:not(:last-child)').forEach(cell => {
            const input = cell.querySelector('input');
            if (input) {
                // Cria um SPAN para o PDF e insere o valor do INPUT
                const span = document.createElement('span');
                span.innerText = input.value || input.placeholder; // Usa o valor ou o placeholder
                
                // Remove o input e insere o SPAN. O CSS no pdf-mode vai exibir este SPAN.
                cell.innerHTML = '';
                cell.appendChild(span);
            }
        });

        // Oculta o botão 'X' (último <td>)
        row.querySelector('.btn-del').parentElement.style.display = 'none';
    });
    
    // Oculta inputs de cabeçalho
    document.querySelectorAll('.input-header-h2, .input-header-div').forEach(input => {
        const span = document.createElement('span');
        span.innerText = input.value || input.placeholder;
        input.parentElement.appendChild(span);
        input.style.display = 'none';
    });
    
    // Oculta campos Cliente/Telefone
    document.getElementById('cliente_nome').style.display = 'none';
    document.getElementById('telefone').style.display = 'none';
    document.getElementById('cliente_nome').parentElement.insertAdjacentHTML('beforeend', `<span>${document.getElementById('cliente_nome').value}</span>`);
    document.getElementById('telefone').parentElement.insertAdjacentHTML('beforeend', `<span>${document.getElementById('telefone').value}</span>`);
    
    // Oculta botão "+ Adicionar item"
    document.getElementById("btn_add").style.display = 'none';
    
    // Oculta o campo de mensagem interativo e mostra só o texto
    const mensagem_input = document.getElementById('mensagem');
    
    mensagem_input.style.display = 'none';
    mensagem_input.parentElement.insertAdjacentHTML('beforeend', `<p>${mensagem_input.value}</p>`);


    await new Promise(r => setTimeout(r, 500)); // Espera o layout estabilizar

    // A CAPTURA VAI ACONTECER COM TODOS OS ITENS VISÍVEIS (expansão)
    const canvas = await html2canvas(invoice, { scale: 2 });
    
    // 🌟 NOVO: REVERTE AS MUDANÇAS APÓS A CAPTURA
    // Recarrega a página para resetar os inputs e botões para a próxima interação
    window.location.reload(); 

    // O restante do código PDF (jspdf)
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // LÓGICA DE PAGINAÇÃO: Se a imagem for maior que o A4, ele adiciona páginas
    let heightLeft = imgHeight;
    let position = 20;

    pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
    }
    
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