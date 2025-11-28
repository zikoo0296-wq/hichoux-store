# 📡 API Documentation - Hichoux Store

Documentation des APIs utilisées dans le système Hichoux Store.

---

## 🗄️ Supabase API

### Base URL
```
https://[PROJECT_ID].supabase.co/rest/v1
```

### Authentication
Toutes les requêtes nécessitent ces headers :
```http
apikey: [ANON_KEY]
Authorization: Bearer [ANON_KEY]
Content-Type: application/json
```

---

## 📦 Products API

### Lister les produits

```http
GET /products?is_active=eq.true&select=*,category:categories(id,name,slug)
```

**Réponse :**
```json
[
  {
    "id": "uuid",
    "sku": "PARFUM-001",
    "name": "Parfum Royal Oud",
    "slug": "parfum-royal-oud",
    "description": "...",
    "price": 150,
    "compare_price": 199,
    "stock": 45,
    "images": ["https://..."],
    "is_featured": true,
    "category": {
      "id": "uuid",
      "name": "Homme",
      "slug": "homme"
    }
  }
]
```

### Produits vedettes

```http
GET /products?is_active=eq.true&is_featured=eq.true
```

### Produit par slug

```http
GET /products?slug=eq.parfum-royal-oud&select=*,category:categories(*)
```

---

## 📋 Orders API

### Créer une commande

```http
POST /orders
```

**Body :**
```json
{
  "customer_name": "Ahmed Benali",
  "customer_phone": "0661234567",
  "shipping_address": "Rue Hassan II, N°45",
  "shipping_city": "Casablanca",
  "subtotal": 300,
  "shipping_cost": 0,
  "total": 300,
  "payment_method": "cod",
  "status": "new",
  "source": "website"
}
```

**Réponse :**
```json
{
  "id": "uuid",
  "order_number": "HCX2511270001",
  "status": "new",
  "created_at": "2025-11-27T10:00:00Z"
}
```

### Lister les commandes

```http
GET /orders?select=*,order_items(*),shipments(*)&order=created_at.desc
```

### Commandes par statut

```http
GET /orders?status=eq.new
```

### Mettre à jour le statut

```http
PATCH /orders?id=eq.[ORDER_ID]
```

**Body :**
```json
{
  "status": "confirmed",
  "confirmed_at": "2025-11-27T12:00:00Z"
}
```

### Rechercher par numéro

```http
GET /orders?order_number=eq.HCX2511270001
```

### Rechercher par téléphone

```http
GET /orders?customer_phone=eq.0661234567
```

---

## 🛒 Order Items API

### Ajouter des items

```http
POST /order_items
```

**Body :**
```json
{
  "order_id": "uuid",
  "product_id": "uuid",
  "product_sku": "PARFUM-001",
  "product_name": "Parfum Royal Oud",
  "quantity": 2,
  "unit_price": 150,
  "total_price": 300
}
```

---

## 👥 Customers API

### Upsert customer

```http
POST /customers
Header: Prefer: resolution=merge-duplicates
```

**Body :**
```json
{
  "phone": "0661234567",
  "name": "Ahmed Benali",
  "address": "Rue Hassan II",
  "city": "Casablanca"
}
```

---

## 🚚 Shipments API

### Créer un envoi

```http
POST /shipments
```

**Body :**
```json
{
  "order_id": "uuid",
  "carrier": "digylog",
  "tracking_number": "S2AD5795M",
  "status": "pending"
}
```

---

## 📊 Google Sheets API

### Base URL
```
https://script.google.com/macros/s/[SCRIPT_ID]/exec
```

### Ajouter une commande

```http
POST /exec
Content-Type: application/json
```

**Body :**
```json
{
  "action": "addOrder",
  "order": {
    "orderRef": "HCX2511270001",
    "name": "Ahmed Benali",
    "phone": "0661234567",
    "address": "Rue Hassan II",
    "city": "Casablanca",
    "codAmount": 300,
    "productSku": "PARFUM-001",
    "quantity": 2,
    "notes": "",
    "status": "Confirmed"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Order added successfully",
  "orderRef": "HCX2511270001",
  "row": 5
}
```

### Ajouter plusieurs commandes

```http
POST /exec
```

**Body :**
```json
{
  "action": "addOrders",
  "orders": [
    { "orderRef": "HCX001", "name": "Client 1", ... },
    { "orderRef": "HCX002", "name": "Client 2", ... }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "total": 2,
  "added": 2,
  "skipped": 0,
  "errors": []
}
```

### Mettre à jour le statut

```http
POST /exec
```

**Body :**
```json
{
  "action": "updateStatus",
  "orderRef": "HCX2511270001",
  "status": "Shipped",
  "tracking": "S2AD5795M"
}
```

### Lister les commandes

```http
POST /exec
```

**Body :**
```json
{
  "action": "getOrders",
  "status": "Confirmed"  // optionnel
}
```

---

## 🚚 Digylog API (Référence)

### Base URL
```
https://api.digylog.com/v2
```

### Authentication
```http
Authorization: Bearer [API_TOKEN]
```

### Créer un envoi

```http
POST /orders
```

**Body :**
```json
{
  "reference": "HCX2511270001",
  "recipient": {
    "name": "Ahmed Benali",
    "phone": "0661234567",
    "address": "Rue Hassan II, N°45",
    "city": "Casablanca"
  },
  "cod_amount": 300,
  "products": [
    {
      "name": "Parfum Royal Oud",
      "quantity": 2,
      "price": 150
    }
  ]
}
```

**Réponse Success :**
```json
{
  "success": true,
  "tracking_number": "S2AD5795M",
  "status": "Sent",
  "label_url": "https://..."
}
```

**Réponse Error :**
```json
{
  "success": false,
  "error": "INVALID_CITY",
  "message": "City 'Sidi Bouzid-SAFI' invalid. Check list of available cities."
}
```

### Tracking URL
```
https://www.digylog.com/suivi-de-colis/?tracking=[TRACKING_NUMBER]
```

---

## 🔐 Supabase Row Level Security

### Policies appliquées

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| products | ✅ Public (active) | 🔐 Auth | 🔐 Auth | 🔐 Auth |
| categories | ✅ Public (active) | 🔐 Auth | 🔐 Auth | 🔐 Auth |
| orders | 🔐 Auth | ✅ Public | 🔐 Auth | 🔐 Auth |
| order_items | 🔐 Auth | ✅ Public | 🔐 Auth | 🔐 Auth |
| customers | 🔐 Auth | ✅ Public | 🔐 Auth | 🔐 Auth |
| shipments | 🔐 Auth | 🔐 Auth | 🔐 Auth | 🔐 Auth |
| shipping_rates | ✅ Public | 🔐 Auth | 🔐 Auth | 🔐 Auth |

---

## 📱 Codes de statut

| Statut | Label | Couleur | Description |
|--------|-------|---------|-------------|
| `new` | Nouvelle | 🟡 Yellow | Commande reçue, en attente |
| `confirmed` | Confirmée | 🔵 Blue | Client confirmé par téléphone |
| `shipped` | Expédiée | 🟣 Purple | Envoyée au transporteur |
| `delivered` | Livrée | 🟢 Green | Reçue par le client |
| `cancelled` | Annulée | 🔴 Red | Commande annulée |
| `returned` | Retournée | 🟠 Orange | Retour au stock |

---

## 🔄 Webhooks (Future)

Pour recevoir des notifications en temps réel, utilisez Supabase Realtime :

```javascript
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    console.log('Change received:', payload);
  })
  .subscribe();
```

---

## 📝 Exemples JavaScript

### Créer une commande complète

```javascript
async function createOrder(orderData, items) {
  // 1. Upsert customer
  const { data: customer } = await supabase
    .from('customers')
    .upsert({ phone: orderData.phone, name: orderData.name })
    .select()
    .single();

  // 2. Create order
  const { data: order } = await supabase
    .from('orders')
    .insert({
      customer_id: customer.id,
      customer_name: orderData.name,
      customer_phone: orderData.phone,
      shipping_city: orderData.city,
      shipping_address: orderData.address,
      total: orderData.total,
      status: 'new'
    })
    .select()
    .single();

  // 3. Add order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    quantity: item.qty,
    unit_price: item.price,
    total_price: item.price * item.qty
  }));

  await supabase.from('order_items').insert(orderItems);

  return order;
}
```

### Confirmer une commande

```javascript
async function confirmOrder(orderId) {
  // Update order
  const { data } = await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  // Add history
  await supabase.from('order_history').insert({
    order_id: orderId,
    status: 'confirmed',
    note: 'Confirmé par admin'
  });

  // Sync to Google Sheets
  await syncToSheet(data);

  return data;
}
```

---

## 🆘 Support

Pour toute question sur l'API :
- 📧 Email: contact@hichouxstore.ma
- 📚 Docs Supabase: https://supabase.com/docs
