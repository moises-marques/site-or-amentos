import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- FUNÇÕES DE SETUP (Assumidas) ---
def get_db():
    # Esta é uma função placeholder. Retorne sua conexão real com o banco de dados.
    class MockCursor:
        def execute(self, query, params=None):
            print(f"DB EXECUTE: {query} with {params}")
        def fetchone(self):
            return (1,) # Simula que criou um novo payment_id
    
    class MockDB:
        def cursor(self):
            return MockCursor()
        def commit(self):
            print("DB COMMIT")
            
    return MockDB()

# --- CONFIGURAÇÃO ---
app = Flask(__name__)
CORS(app)  # Habilita CORS para o frontend chamar a API

# Sua chave sandbox PagBank
PAGBANK_SANDBOX_TOKEN = os.environ.get("PAGBANK_SANDBOX_TOKEN", "11d42019-c83b-4f3b-8569-ae12363c2c9231f0a80047c7b5ffef5b27de4ff163475618-a631-420d-9f82-9d23ce018ae2")
PAGBANK_API_URL = "https://sandbox.api.pagseguro.com/orders"

# O SEU DOMÍNIO PÚBLICO (ATUALIZE SEMPRE QUE O NGROK MUDAR!)
WEBHOOK_BASE_URL = "https://9cc1183189a3.ngrok-free.app"

# ========================================================
# ROTA 1: CRIAÇÃO DO PAGAMENTO (CHAMADA PELO FRONTEND)
# ========================================================

def create_payment_real(amount):
    conn = get_db()
    cur = conn.cursor()
    
    # Cria um registro inicial no banco
    cur.execute("INSERT INTO payments (status) VALUES (?)", ("pending",))
    payment_id = cur.fetchone()[0]  # Simula ID do pagamento

    if not PAGBANK_SANDBOX_TOKEN:
        return jsonify({"error": "PagBank Sandbox Token não configurado"}), 500

    # Monta o payload do sandbox PagBank
    payload = {
        "reference_id": f"ORD-{payment_id}",
        "customer": {
            "name": "Cliente Teste",
            "email": "teste.sandbox@example.com",
            "tax_id": "12345678909"
        },
        "charges": [
            {
                "reference_id": f"ORD-{payment_id}",
                "description": "Assinatura Mensal Sandbox",
                "amount": {
                    "value": int(amount * 100),  # converte para centavos
                    "currency": "BRL"
                },
                "payment_method": {
                    "type": "BOLETO"
                }
            }
        ],
        "notification_urls": [f"{WEBHOOK_BASE_URL}/webhook/pagbank"]
    }

    try:
        resp = requests.post(
            PAGBANK_API_URL,
            headers={
                "Authorization": f"Bearer {PAGBANK_SANDBOX_TOKEN}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=20
        )
        resp.raise_for_status()
        data = resp.json()

        # Pega a URL de checkout e o external_id
        checkout_url = data["links"][0]["href"]
        external_id = data["id"]

        # Atualiza banco com external_id
        cur.execute("UPDATE payments SET external_id = ?, updated_at = ? WHERE id = ?",
                    (external_id, datetime.utcnow().isoformat(), payment_id))
        conn.commit()

        return jsonify({
            "payment_id": payment_id,
            "external_id": external_id,
            "payment_url": checkout_url
        })

    except Exception as e:
        cur.execute("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?",
                    ("failed", datetime.utcnow().isoformat(), payment_id))
        conn.commit()
        return jsonify({"error": "Falha ao criar pagamento", "details": str(e)}), 500


@app.route("/create-payment", methods=["POST", "OPTIONS"])
def api_payments_create():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.json or {}
    amount = float(data.get("amount", 0.0))

    return create_payment_real(amount)


# ========================================================
# ROTA 2: RECEBIMENTO DO WEBHOOK (CHAMADA PELO PAGBANK)
# ========================================================

@app.route("/webhook/pagbank", methods=["POST"])
def pagbank_webhook():
    data = request.json

    if not data:
        return jsonify({"error": "JSON inválido"}), 400

    try:
        external_id = data.get("id")
        charge = data.get("charges", [{}])[0]
        status = charge.get("status", "").upper()

        pagbank_to_local = {
            "PAID": "paid",
            "AUTHORIZED": "paid",
            "DECLINED": "failed",
            "CANCELED": "canceled",
            "EXPIRED": "expired",
            "IN_PROTEST": "pending",
            "WAITING": "pending"
        }

        local_status = pagbank_to_local.get(status, "pending")

        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            UPDATE payments
            SET status = ?, updated_at = ?
            WHERE external_id = ?
        """, (local_status, datetime.utcnow().isoformat(), external_id))
        conn.commit()

        return jsonify({"message": "Webhook recebido", "local_status": local_status})

    except Exception as e:
        return jsonify({"error": "Falha ao processar webhook", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
