const { jsPDF } = window.jspdf;

let itemIndex = 0;
const itensBody = document.getElementById('itens_body');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');

function formatBR(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}
function parseNum(v) {
  return Number(String(v).replace(',', '.')) || 0;
}

function addItem(item = '', qty = 1, desc = '', price = 0) {
  itemIndex++;
  const tr = document.createElement('tr');
  tr.dataset.idx = itemIndex;
  tr.innerHTML = `
    <td><input class="border p-1 w-36" value="${item}" data-field="item"></td>
    <td><input class="border p-1 w-16 text-right" value="${qty}" data-field="qty"></td>
    <td><input class="border p-1 w-full" value="${desc}" data-field="desc"></td>
    <td><input class="border p-1 w-28 text-right" value="${price.toFixed(2)}" data-field="price"></td>
    <td class="text-right" data-field="line_total">R$ 0,00</td>
    <td><button data-action="remove" class="text-red-600">✖</button></td>
  `;
  itensBody.appendChild(tr);

  tr.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => updateTotals());
  });

  tr.querySelector('[data-action="remove"]').addEventListener('click', () => {
    tr.remove();
    updateTotals();
  });

  updateTotals();
}


function updateTotals() {
  let subtotal = 0;
  document.querySelectorAll('#itens_body tr').forEach(tr => {
    const qty = parseNum(tr.querySelector('[data-field="qty"]').value);
    const price = parseNum(tr.querySelector('[data-field="price"]').value);
    const line = qty * price;
    tr.querySelector('[data-field="line_total"]').textContent = 'R$ ' + formatBR(line);
    subtotal += line;
  });
  subtotalEl.textContent = formatBR(subtotal);
  totalEl.textContent = formatBR(subtotal);
}

document.getElementById('btn_add').addEventListener('click', () => addItem(1, 'Item descrito', 0.00));

document.getElementById('btn_reset').addEventListener('click', () => {
  document.getElementById('cliente_nome').value = '';
  document.getElementById('telefone').value = '';
  document.getElementById('mensagem').value = 'Obrigado pelo contato. Prazo X dias. Validade deste orçamento: 7 dias.';
  itensBody.innerHTML = '';
  updateTotals();
});

document.getElementById('btn_pdf').addEventListener('click', async () => {
  const invoiceEl = document.getElementById('invoice');
  const originalWidth = invoiceEl.style.width;
  invoiceEl.style.width = '800px';
  const canvas = await html2canvas(invoiceEl, { scale: 2 });
  invoiceEl.style.width = originalWidth;

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
  const fname = `orcamento_${Date.now()}.pdf`;
  pdf.save(fname);
});

document.getElementById('btn_whatsapp').addEventListener('click', () => {
  const cliente = document.getElementById('cliente_nome').value || '[cliente]';
  const total = totalEl.textContent || '0,00';
  const msg = encodeURIComponent(`Olá ${cliente}, segue orçamento — total R$ ${total}. Quer confirmar? (responda aqui)`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
});

// === Ajuste automático de data-label na tabela (modo celular) ===
function atualizarDataLabels() {
  const tabela = document.getElementById('tabela_itens');
  const cabecalhos = Array.from(tabela.querySelectorAll('thead th')).map(th => th.textContent.trim());
  const linhas = tabela.querySelectorAll('tbody tr');

  linhas.forEach(linha => {
    const celulas = linha.querySelectorAll('td');
    celulas.forEach((td, i) => {
      if (cabecalhos[i]) {
        td.setAttribute('data-label', cabecalhos[i]);
      }
    });
  });
}

// roda toda vez que os itens forem atualizados
const observer = new MutationObserver(atualizarDataLabels);
observer.observe(document.getElementById('itens_body'), { childList: true, subtree: true });

// roda na carga inicial também
window.addEventListener('load', atualizarDataLabels);


// inicial
addItem('Produto A', 1, 'Exemplo de serviço', 120.00);
updateTotals();
