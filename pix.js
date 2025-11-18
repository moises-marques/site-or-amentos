function copiarPix() {
  const chave = "e511361a-3dca-4e6f-81b3-3b3d2f52ff77";

  navigator.clipboard.writeText(chave)
    .then(() => alert("Chave PIX copiada!"))
    .catch(() => {
      prompt("Copie a chave PIX abaixo:", chave);
    });
}

function gerarPix() {
  const chave = "e511361a-3dca-4e6f-81b3-3b3d2f52ff77";

  document.getElementById("qrcode").innerHTML = `
      <p style="font-size:16px;margin-bottom:10px;">
          <strong>Chave PIX:</strong><br>
          ${chave}
      </p>

      <button
          style="margin-top:10px;padding:8px 16px;border-radius:6px;cursor:pointer;"
          onclick="copiarPix()">
          Copiar chave PIX
      </button>
  `;
}

gerarPix();
